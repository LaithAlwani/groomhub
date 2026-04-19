import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

import { useAuth } from "../context/AuthContext";
import { parseContactsXml } from "../utils/xml";
import Icon from "../assets/Icon";
import UserManagement from "../components/UserManagement";

export default function AdminView() {
  const { user } = useAuth();
  const fileRef           = useRef(null);
  const importBatch       = useMutation(api.clients.importBatch);

  const [status,       setStatus]       = useState("idle");
  const [progress,     setProgress]     = useState({ done: 0, total: 0 });
  const [errorMsg,     setErrorMsg]     = useState("");

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

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;


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
          appointment history.
        </p>

        {(status === "idle" || status === "error") && (
          <>
            <input ref={fileRef} type="file" accept=".xml" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Browse &amp; Import
            </button>
            {status === "error" && (
              <p className="mt-3 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">{errorMsg}</p>
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
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
