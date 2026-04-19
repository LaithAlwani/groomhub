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

// Store phone_search as space-separated tokens.
// Each phone contributes two tokens: full digits + last-4-digits suffix.
// e.g. "613-864-2922" → "6138642922 2922"
// Full-text search tokenises on spaces, so both are independently searchable.
function buildPhoneSearch(phones: { number: string }[]): string {
  const tokens: string[] = [];
  for (const p of phones) {
    const digits = p.number.replace(/\D/g, "");
    if (!digits) continue;
    tokens.push(digits);
    if (digits.length > 4) tokens.push(digits.slice(-4));
  }
  return tokens.join(" ");
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const searchByName = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    // Search full name and last name separately, then deduplicate by _id
    const [byFullName, byLastName] = await Promise.all([
      ctx.db
        .query("clients")
        .withSearchIndex("search_by_name", (q) =>
          q.search("client_name", args.query),
        )
        .take(25),
      ctx.db
        .query("clients")
        .withSearchIndex("search_by_last_name", (q) =>
          q.search("last_name", args.query),
        )
        .take(25),
    ]);

    const seen = new Set<string>();
    const merged = [];
    for (const c of [...byFullName, ...byLastName]) {
      if (!seen.has(c._id)) {
        seen.add(c._id);
        merged.push(c);
      }
    }
    return merged.sort((a, b) => a.client_name.localeCompare(b.client_name));
  },
});

export const searchByPhone = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const digitsOnly = args.query.replace(/\D/g, "");
    if (!digitsOnly) return [];
    const results = await ctx.db
      .query("clients")
      .withSearchIndex("search_by_phone", (q) =>
        q.search("phone_search", digitsOnly),
      )
      .take(25);
    return results.sort((a, b) =>
      a.client_name.localeCompare(b.client_name),
    );
  },
});

export const listClients = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_client_name")
      .order("asc")
      .paginate(args.paginationOpts);
  },
});

export const getClient = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createClient = mutation({
  args: {
    sessionToken: v.string(),
    first_name: v.string(),
    last_name: v.optional(v.string()),
    phones: v.array(
      v.object({ number: v.string(), type: v.optional(v.string()) }),
    ),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSession(ctx, args.sessionToken);

    const firstName = args.first_name.trim();
    if (!firstName) throw new Error("First name is required");
    const lastName = args.last_name?.trim() ?? "";
    const clientName = [firstName, lastName].filter(Boolean).join(" ");

    const normalizedPhones = args.phones.map((p) => ({
      ...p,
      number: formatPhone(p.number),
    }));
    const now = Date.now();

    return await ctx.db.insert("clients", {
      first_name: firstName,
      last_name: lastName || undefined,
      client_name: clientName,
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

export const updateClient = mutation({
  args: {
    sessionToken: v.string(),
    clientId:     v.id("clients"),
    first_name:   v.string(),
    last_name:    v.optional(v.string()),
    phones: v.array(
      v.object({ number: v.string(), type: v.optional(v.string()) }),
    ),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.sessionToken);

    const firstName = args.first_name.trim();
    if (!firstName) throw new Error("First name is required");
    const lastName   = args.last_name?.trim() ?? "";
    const clientName = [firstName, lastName].filter(Boolean).join(" ");

    const normalizedPhones = args.phones.map((p) => ({
      ...p,
      number: formatPhone(p.number),
    }));

    await ctx.db.patch(args.clientId, {
      first_name:   firstName,
      last_name:    lastName || undefined,
      client_name:  clientName,
      phones:       normalizedPhones,
      email:        args.email?.trim() || undefined,
      phone_search: buildPhoneSearch(normalizedPhones),
      updated_at:   Date.now(),
    });
  },
});

// Admin-only: import a batch of clients parsed from contacts.xml
export const importBatch = mutation({
  args: {
    sessionToken: v.string(),
    clients: v.array(
      v.object({
        first_name: v.string(),
        last_name:  v.optional(v.string()),
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
    await requireAdmin(ctx, args.sessionToken);

    if (args.clients.length > 20) {
      throw new Error("Maximum 20 clients per batch");
    }

    const now = Date.now();
    const inserted: Id<"clients">[] = [];

    for (const c of args.clients) {
      const firstName = c.first_name.trim();
      if (!firstName) continue;
      const lastName   = c.last_name?.trim() ?? "";
      const clientName = [firstName, lastName].filter(Boolean).join(" ");

      const phoneSearch = buildPhoneSearch(c.phones);

      const validPets = c.pets.filter(
        (p) => p.name.trim() || (p.breed && p.breed !== "unknown"),
      );

      const clientId = await ctx.db.insert("clients", {
        first_name:  firstName,
        last_name:   lastName || undefined,
        client_name: clientName,
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
          contact_id: clientId,
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
          contact_id: clientId,
          note_text: c.notes.trim(),
          is_legacy: true,
          createdBy: "import",
          created_at: now,
        });
      }

      inserted.push(clientId);
    }

    return { inserted: inserted.length };
  },
});
