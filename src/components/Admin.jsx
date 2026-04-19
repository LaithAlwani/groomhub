import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";
import UserManagement from "./UserManagement";

// Normalize a phone number to 613-XXX-XXXX format.
// 7-digit numbers (local Ottawa) get the 613 area code prepended.
// 10-digit numbers (already have area code) are reformatted as-is.
function normalizePhone(raw) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 7)
    return `613-${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1")
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim() || null; // unknown format — keep raw
}

// If breed contains "cat" → species is cat. Everything else defaults to dog.
function detectSpecies(breed) {
  return /cat/i.test(breed ?? "") ? "cat" : "dog";
}

// Strip surrounding quote characters that the source app stores in name fields.
// e.g. `"Addie"` → `Addie`, `'Max'` → `Max`
function stripQuotes(s) {
  return s.replace(/^[\s"']+|[\s"']+$/g, "");
}

function parseContactsXml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const contacts = [];

  for (const c of doc.querySelectorAll("Contact")) {
    const getField = (name) =>
      c.querySelector(`Field[Name="${name}"]`)?.getAttribute("Value")?.trim() ?? "";

    // Extract first name (GivenName) and last name (Surname).
    // Strip surrounding quotes used for pet-name-style entries e.g. `"Addie"`.
    const first_name = stripQuotes(c.getAttribute("GivenName") ?? "");
    // Avoid "Smith Smith" when both attributes hold the same value
    const rawSurname = stripQuotes(c.getAttribute("Surname") ?? "");
    const last_name  = rawSurname === first_name ? "" : rawSurname;
    if (!first_name) continue;

    // Collect all Phone* fields, normalize numbers, deduplicate by digits
    const seenDigits = new Set();
    const phones = Array.from(c.querySelectorAll("Field"))
      .filter((f) => /^Phone/i.test(f.getAttribute("Name") ?? ""))
      .map((f) => {
        const fieldName  = f.getAttribute("Name") ?? "";
        const normalized = normalizePhone(f.getAttribute("Value"));
        if (!normalized) return null;
        const digits = normalized.replace(/\D/g, "");
        if (seenDigits.has(digits)) return null;
        seenDigits.add(digits);
        // "Phone" (exact) → main; anything else (Phone2, Phone2 cell, …) → cell
        const type = fieldName.trim() === "Phone" ? "main" : "cell";
        return { number: normalized, type };
      })
      .filter(Boolean);

    // Pets — strip "(dead)" suffix, detect species from breed
    const pets = [
      { name: getField("Pet Name 1"), breed: getField("Breed 1") },
      { name: getField("Pet Name 2"), breed: getField("Breed 2") },
      { name: getField("Pet Name 3"), breed: getField("Breed 3") },
    ]
      .filter((p) => p.name || p.breed)
      .map((p) => ({
        name:    p.name || "",
        breed:   p.breed || "unknown",
        species: detectSpecies(p.breed),
      }));

    const notes = c.querySelector("Notes")?.textContent?.trim() ?? "";

    contacts.push({
      first_name,
      last_name: last_name || undefined,
      phones,
      notes: notes || undefined,
      pets,
    });
  }

  return contacts;
}

export default function Admin() {
  const { user } = useAuth();
  const fileRef    = useRef(null);
  const importBatch = useMutation(api.clients.importBatch);

  const [status,   setStatus]   = useState("idle"); // idle | parsing | importing | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("parsing");
    setErrorMsg("");

    let contacts;
    try {
      const text = await file.text();
      contacts = parseContactsXml(text);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Failed to parse XML: " + (err.message ?? "unknown error"));
      return;
    }

    setProgress({ done: 0, total: contacts.length });
    setStatus("importing");

    const BATCH_SIZE = 20;
    let done = 0;

    try {
      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        const batch = contacts.slice(i, i + BATCH_SIZE);
        await importBatch({ sessionToken: user.sessionToken, clients: batch });
        done += batch.length;
        setProgress({ done, total: contacts.length });
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message ?? "Import failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const pct = progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-text-primary">Admin</h1>
        <p className="text-sm text-text-secondary mt-0.5">Management tools</p>
      </div>

      <UserManagement />

      <div className="bg-background-card border border-border rounded-2xl p-6 max-w-lg shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="scissors" className="w-4 h-4 text-text-muted" />
          <h2 className="font-semibold text-text-primary">Import contacts.xml</h2>
        </div>
        <p className="text-sm text-text-secondary mb-5">
          Select your exported contacts.xml file to import all clients, pets, and
          appointment history. Duplicate phone numbers are skipped automatically.
        </p>

        {(status === "idle" || status === "error") && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Browse &amp; Import
            </button>
            {status === "error" && (
              <p className="mt-3 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
          </>
        )}

        {status === "parsing" && (
          <p className="text-sm text-text-secondary">Parsing XML…</p>
        )}

        {status === "importing" && (
          <div className="space-y-2">
            <p className="text-sm text-text-primary">
              Importing {progress.done} / {progress.total} contacts…
            </p>
            <div className="w-full bg-background-sidebar rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">{pct}%</p>
          </div>
        )}

        {status === "done" && (
          <div className="flex items-center gap-2 text-success-text bg-success-light rounded-xl px-3 py-2 text-sm">
            <Icon name="check" className="w-4 h-4 shrink-0" />
            <span>Import complete — {progress.total} contacts processed.</span>
          </div>
        )}
      </div>
    </div>
  );
}

