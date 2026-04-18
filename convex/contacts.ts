import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireSession, requireAdmin } from "./sessions";

// Format a phone number to xxx-xxx-xxxx.
// 7-digit numbers get 613 prepended (Ottawa local).
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 7)  return `613-${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1")
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim();
}

// Store phone_search as space-separated digits only (no dashes).
// Full-text search then tokenises on spaces, so "6138642922" is one exact token.
function buildPhoneSearch(phones: { number: string }[]): string {
  return phones
    .map((p) => p.number.replace(/\D/g, ""))
    .filter(Boolean)
    .join(" ");
}

// ─── Queries (read-only, public — data is not sensitive enough to lock down reads) ──

export const searchByName = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const results = await ctx.db
      .query("contacts")
      .withSearchIndex("search_by_name", (q) =>
        q.search("client_name", args.query),
      )
      .take(25);
    return results.sort((a, b) =>
      a.client_name.localeCompare(b.client_name),
    );
  },
});

export const searchByPhone = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    // Strip non-digits so "613-864-2922" and "6138642922" both search the same token
    const digitsOnly = args.query.replace(/\D/g, "");
    if (!digitsOnly) return [];
    const results = await ctx.db
      .query("contacts")
      .withSearchIndex("search_by_phone", (q) =>
        q.search("phone_search", digitsOnly),
      )
      .take(25);
    return results.sort((a, b) =>
      a.client_name.localeCompare(b.client_name),
    );
  },
});

export const listContacts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_client_name")
      .order("asc")
      .paginate(args.paginationOpts);
  },
});

export const getContact = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations (all require a valid session token) ────────────────────────────

export const createContact = mutation({
  args: {
    sessionToken: v.string(),
    client_name: v.string(),
    phones: v.array(
      v.object({ number: v.string(), type: v.optional(v.string()) }),
    ),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSession(ctx, args.sessionToken);

    const name = args.client_name.trim();
    if (!name) throw new Error("Client name is required");

    const normalizedPhones = args.phones.map((p) => ({
      ...p,
      number: formatPhone(p.number),
    }));
    const now = Date.now();

    return await ctx.db.insert("contacts", {
      client_name: name,
      phones: normalizedPhones,
      email: args.email,
      phone_search: buildPhoneSearch(normalizedPhones),
      pet_count: 0,
      createdBy: user.displayName,
      created_at: now,
      updated_at: now,
    });
  },
});

// Admin-only: import a batch of contacts parsed from contacts.xml
export const importBatch = mutation({
  args: {
    sessionToken: v.string(),
    contacts: v.array(
      v.object({
        client_name: v.string(),
        phones: v.array(
          v.object({ number: v.string(), type: v.optional(v.string()) }),
        ),
        email: v.optional(v.string()),
        notes: v.optional(v.string()),
        pets: v.array(
          v.object({
            name:    v.string(),
            breed:   v.string(),
            species: v.optional(v.string()),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Only admins can bulk-import data
    await requireAdmin(ctx, args.sessionToken);

    if (args.contacts.length > 20) {
      throw new Error("Maximum 20 contacts per batch");
    }

    const now = Date.now();
    const inserted: Id<"contacts">[] = [];

    for (const c of args.contacts) {
      const name = c.client_name.trim();
      if (!name) continue;

      const phoneSearch = buildPhoneSearch(c.phones);

      // Insert pets first so we can count what actually gets saved
      // A pet is valid if it has a name OR a breed (not both empty)
      const validPets = c.pets.filter(
        (p) => p.name.trim() || (p.breed && p.breed !== "unknown"),
      );

      const contactId = await ctx.db.insert("contacts", {
        client_name: name,
        phones: c.phones,
        email: c.email,
        phone_search: phoneSearch,
        pet_count: validPets.length,
        createdBy: "import",
        created_at: now,
        updated_at: now,
      });

      for (const pet of validPets) {
        const isActive = !pet.name.toLowerCase().includes("(dead)");
        const petName  = pet.name.replace(/\s*\(dead\)\s*/i, "").trim();
        await ctx.db.insert("pets", {
          contact_id: contactId,
          name:       petName,
          breed:      pet.breed || "unknown",
          species:    pet.species,
          is_active:  isActive,
          created_at: now,
          updated_at: now,
        });
      }

      if (c.notes?.trim()) {
        await ctx.db.insert("appointments", {
          contact_id: contactId,
          note_text: c.notes.trim(),
          is_legacy: true,
          createdBy: "import",
          created_at: now,
        });
      }

      inserted.push(contactId);
    }

    return { inserted: inserted.length };
  },
});
