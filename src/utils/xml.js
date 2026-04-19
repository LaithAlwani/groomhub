import { normalizePhone } from "./phone.js";

/**
 * Strip surrounding quote/whitespace characters the source app stores in name fields.
 * e.g. `"Addie"` → `Addie`
 */
export function stripQuotes(s) {
  return s.replace(/^[\s"']+|[\s"']+$/g, "");
}

/**
 * Infer species from breed string during XML import.
 * Checks for common keywords; defaults to dog.
 */
export function detectSpecies(breed) {
  const b = (breed ?? "").toLowerCase();
  if (/cat|feline|dsh|dlh|dmh/.test(b))   return "cat";
  if (/rabbit|bunny/.test(b))              return "rabbit";
  if (/guinea\s*pig|cavy/.test(b))         return "guinea pig";
  if (/hamster/.test(b))                   return "hamster";
  if (/bird|parrot|cockatiel|canary/.test(b)) return "bird";
  if (/ferret/.test(b))                    return "ferret";
  if (/reptile|lizard|snake|gecko/.test(b)) return "reptile";
  return "dog";
}

/**
 * Parse an OpenContacts XML export into an array of client objects
 * ready to pass to the importBatch mutation.
 */
export function parseContactsXml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const contacts = [];

  for (const c of doc.querySelectorAll("Contact")) {
    const getField = (name) =>
      c.querySelector(`Field[Name="${name}"]`)?.getAttribute("Value")?.trim() ?? "";

    const first_name = stripQuotes(c.getAttribute("GivenName") ?? "");
    const rawSurname = stripQuotes(c.getAttribute("Surname")   ?? "");
    const last_name  = rawSurname === first_name ? "" : rawSurname;
    if (!first_name) continue;

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
        return { number: normalized, type: fieldName.trim() === "Phone" ? "main" : "cell" };
      })
      .filter(Boolean);

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
