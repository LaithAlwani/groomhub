import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireShopAccess, requireAdmin, requireSuperAdmin } from "./sessions";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 7)  return `613-${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === "1")
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim();
}

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
    const { shopId } = await requireShopAccess(ctx);
    if (!args.query.trim()) return [];

    const [byFullName, byLastName] = await Promise.all([
      ctx.db
        .query("clients")
        .withSearchIndex("search_by_name", (q) =>
          q.search("client_name", args.query).eq("shopId", shopId),
        )
        .take(25),
      ctx.db
        .query("clients")
        .withSearchIndex("search_by_last_name", (q) =>
          q.search("last_name", args.query).eq("shopId", shopId),
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
    const { shopId } = await requireShopAccess(ctx);
    if (!args.query.trim()) return [];
    const digitsOnly = args.query.replace(/\D/g, "");
    if (!digitsOnly) return [];
    const results = await ctx.db
      .query("clients")
      .withSearchIndex("search_by_phone", (q) =>
        q.search("phone_search", digitsOnly).eq("shopId", shopId),
      )
      .take(25);
    return results.sort((a, b) => a.client_name.localeCompare(b.client_name));
  },
});

export const getTotalCount = query({
  args: {},
  handler: async (ctx) => {
    const { shopId } = await requireShopAccess(ctx);
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_shop_and_name", (q) => q.eq("shopId", shopId))
      .take(10000);
    return clients.length;
  },
});

export const listClients = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);
    return await ctx.db
      .query("clients")
      .withIndex("by_shop_and_name", (q) => q.eq("shopId", shopId))
      .order("asc")
      .paginate(args.paginationOpts);
  },
});

export const getClient = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);
    const client = await ctx.db.get(args.id);
    if (!client || client.shopId !== shopId) return null;
    return client;
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createClient = mutation({
  args: {
    first_name:  v.string(),
    last_name:   v.optional(v.string()),
    phones:      v.array(v.object({ number: v.string(), type: v.optional(v.string()) })),
    email:       v.optional(v.string()),
    address:     v.optional(v.string()),
    city:        v.optional(v.string()),
    province:    v.optional(v.string()),
    postal_code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireShopAccess(ctx);

    const firstName  = args.first_name.trim().toLowerCase();
    if (!firstName) throw new Error("First name is required");
    const lastName   = args.last_name?.trim().toLowerCase() ?? "";
    const clientName = [firstName, lastName].filter(Boolean).join(" ");

    const normalizedPhones = args.phones.map((p) => ({
      ...p,
      number: formatPhone(p.number),
    }));
    const now = Date.now();

    return await ctx.db.insert("clients", {
      shopId,
      first_name:   firstName,
      last_name:    lastName || undefined,
      client_name:  clientName,
      phones:       normalizedPhones,
      email:        args.email?.trim().toLowerCase() || undefined,
      address:      args.address?.trim().toLowerCase() || undefined,
      city:         args.city?.trim().toLowerCase() || undefined,
      province:     args.province?.trim().toLowerCase() || undefined,
      postal_code:  args.postal_code?.trim().toLowerCase() || undefined,
      phone_search: buildPhoneSearch(normalizedPhones),
      pet_count:    0,
      createdBy:    identity.name ?? identity.email ?? "Unknown",
      created_at:   now,
      updated_at:   now,
    });
  },
});

export const updateClient = mutation({
  args: {
    clientId:       v.id("clients"),
    first_name:     v.string(),
    last_name:      v.optional(v.string()),
    phones:         v.array(v.object({ number: v.string(), type: v.optional(v.string()) })),
    email:          v.optional(v.string()),
    address:        v.optional(v.string()),
    city:           v.optional(v.string()),
    province:       v.optional(v.string()),
    postal_code:    v.optional(v.string()),
    is_blacklisted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);

    const client = await ctx.db.get(args.clientId);
    if (!client || client.shopId !== shopId) throw new Error("Not found");

    const firstName  = args.first_name.trim().toLowerCase();
    if (!firstName) throw new Error("First name is required");
    const lastName   = args.last_name?.trim().toLowerCase() ?? "";
    const clientName = [firstName, lastName].filter(Boolean).join(" ");

    const normalizedPhones = args.phones.map((p) => ({
      ...p,
      number: formatPhone(p.number),
    }));

    await ctx.db.patch(args.clientId, {
      first_name:     firstName,
      last_name:      lastName || undefined,
      client_name:    clientName,
      phones:         normalizedPhones,
      email:          args.email?.trim().toLowerCase() || undefined,
      address:        args.address?.trim().toLowerCase() || undefined,
      city:           args.city?.trim().toLowerCase() || undefined,
      province:       args.province?.trim().toLowerCase() || undefined,
      postal_code:    args.postal_code?.trim().toLowerCase() || undefined,
      phone_search:   buildPhoneSearch(normalizedPhones),
      is_blacklisted: args.is_blacklisted ?? false,
      updated_at:     Date.now(),
    });
  },
});

export const deleteClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const { shopId } = await requireSuperAdmin(ctx);

    const client = await ctx.db.get(args.clientId);
    if (!client || client.shopId !== shopId) throw new Error("Not found");

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_contact_and_date", (q) => q.eq("contact_id", args.clientId))
      .take(10000);
    for (const appt of appointments) await ctx.db.delete(appt._id);

    const pets = await ctx.db
      .query("pets")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.clientId))
      .take(1000);
    for (const pet of pets) await ctx.db.delete(pet._id);

    await ctx.db.delete(args.clientId);
  },
});

export const importBatch = mutation({
  args: {
    clients: v.array(
      v.object({
        first_name: v.string(),
        last_name:  v.optional(v.string()),
        phones:     v.array(v.object({ number: v.string(), type: v.optional(v.string()) })),
        email:      v.optional(v.string()),
        notes:      v.optional(v.string()),
        pets:       v.array(v.object({
          name:    v.string(),
          breed:   v.string(),
          species: v.optional(v.string()),
        })),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { shopId } = await requireAdmin(ctx);

    if (args.clients.length > 20) throw new Error("Maximum 20 clients per batch");

    const now = Date.now();
    const inserted: Id<"clients">[] = [];

    for (const c of args.clients) {
      const firstName  = c.first_name.trim();
      if (!firstName) continue;
      const lastName   = c.last_name?.trim() ?? "";
      const clientName = [firstName, lastName].filter(Boolean).join(" ");

      const validPets = c.pets.filter(
        (p) => p.name.trim() || (p.breed && p.breed !== "unknown"),
      );

      const clientId = await ctx.db.insert("clients", {
        shopId,
        first_name:   firstName,
        last_name:    lastName || undefined,
        client_name:  clientName,
        phones:       c.phones,
        email:        c.email,
        phone_search: buildPhoneSearch(c.phones),
        pet_count:    validPets.length,
        createdBy:    "import",
        created_at:   now,
        updated_at:   now,
      });

      for (const pet of validPets) {
        const isActive = !pet.name.toLowerCase().includes("(dead)");
        const petName  = pet.name.replace(/\s*\(dead\)\s*/i, "").trim();
        await ctx.db.insert("pets", {
          shopId,
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
          shopId,
          contact_id: clientId,
          note_text:  c.notes.trim(),
          is_legacy:  true,
          createdBy:  "import",
          created_at: now,
        });
      }

      inserted.push(clientId);
    }

    return { inserted: inserted.length };
  },
});
