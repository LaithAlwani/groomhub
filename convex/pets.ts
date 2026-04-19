import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSession, requireAdmin } from "./sessions";

export const getPetsByContact = query({
  args: { contactId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pets")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contactId))
      .take(50);
  },
});

export const addPet = mutation({
  args: {
    sessionToken: v.string(),
    clientId:     v.id("clients"),
    name:         v.string(),
    breed:        v.string(),
    species:      v.optional(v.string()),
    gender:       v.optional(v.string()),
    birthdate:    v.optional(v.string()),
    weight:       v.optional(v.number()),
    temperament:  v.optional(v.string()),
    allergies:    v.optional(v.array(v.string())),
    notes:        v.optional(v.string()),
    is_active:    v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.sessionToken);
    const now = Date.now();

    await ctx.db.insert("pets", {
      contact_id:  args.clientId,
      name:        args.name.trim(),
      breed:       args.breed.trim() || "unknown",
      species:     args.species,
      gender:      args.gender,
      birthdate:   args.birthdate,
      weight:      args.weight,
      temperament: args.temperament,
      allergies:   args.allergies,
      notes:       args.notes?.trim() || undefined,
      is_active:   args.is_active ?? true,
      created_at:  now,
      updated_at:  now,
    });

    const client = await ctx.db.get(args.clientId);
    if (client) {
      await ctx.db.patch(args.clientId, {
        pet_count:  (client.pet_count ?? 0) + 1,
        updated_at: now,
      });
    }
  },
});

export const updatePet = mutation({
  args: {
    sessionToken: v.string(),
    petId:        v.id("pets"),
    name:         v.string(),
    breed:        v.string(),
    species:      v.optional(v.string()),
    gender:       v.optional(v.string()),
    birthdate:    v.optional(v.string()),
    weight:       v.optional(v.number()),
    temperament:  v.optional(v.string()),
    allergies:    v.optional(v.array(v.string())),
    notes:        v.optional(v.string()),
    is_active:    v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.sessionToken);

    await ctx.db.patch(args.petId, {
      name:        args.name.trim(),
      breed:       args.breed.trim() || "unknown",
      species:     args.species,
      gender:      args.gender,
      birthdate:   args.birthdate,
      weight:      args.weight,
      temperament: args.temperament,
      allergies:   args.allergies,
      notes:       args.notes?.trim() || undefined,
      is_active:   args.is_active,
      updated_at:  Date.now(),
    });
  },
});

export const deletePet = mutation({
  args: {
    sessionToken: v.string(),
    petId:        v.id("pets"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const pet = await ctx.db.get(args.petId);
    if (!pet) throw new Error("Pet not found");

    await ctx.db.delete(args.petId);

    const client = await ctx.db.get(pet.contact_id);
    if (client) {
      await ctx.db.patch(pet.contact_id, {
        pet_count:  Math.max(0, (client.pet_count ?? 1) - 1),
        updated_at: Date.now(),
      });
    }
  },
});
