import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireShopAccess } from "./sessions";

export const getVaccinationsByContact = query({
  args: { contactId: v.id("clients") },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);
    const client = await ctx.db.get(args.contactId);
    if (!client || client.shopId !== shopId) return [];
    const records = await ctx.db
      .query("vaccinations")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contactId))
      .take(200);
    return records.sort((a, b) =>
      (b.administered_date ?? "").localeCompare(a.administered_date ?? ""),
    );
  },
});

export const addVaccination = mutation({
  args: {
    petId:             v.id("pets"),
    contactId:         v.id("clients"),
    vaccine_name:      v.string(),
    administered_date: v.string(),
    due_date:          v.optional(v.string()),
    vet_clinic:        v.optional(v.string()),
    vet_phone:         v.optional(v.string()),
    notes:             v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireShopAccess(ctx);

    const pet = await ctx.db.get(args.petId);
    if (!pet || pet.shopId !== shopId) throw new Error("Pet not found");

    const now = Date.now();
    return await ctx.db.insert("vaccinations", {
      shopId,
      pet_id:            args.petId,
      contact_id:        args.contactId,
      vaccine_name:      args.vaccine_name.trim(),
      administered_date: args.administered_date,
      due_date:          args.due_date || undefined,
      vet_clinic:        args.vet_clinic?.trim() || undefined,
      vet_phone:         args.vet_phone?.trim() || undefined,
      notes:             args.notes?.trim() || undefined,
      createdBy:         identity.name ?? identity.email ?? "Unknown",
      created_at:        now,
      updated_at:        now,
    });
  },
});

export const updateVaccination = mutation({
  args: {
    vaccinationId:     v.id("vaccinations"),
    vaccine_name:      v.string(),
    administered_date: v.string(),
    due_date:          v.optional(v.string()),
    vet_clinic:        v.optional(v.string()),
    vet_phone:         v.optional(v.string()),
    notes:             v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);

    const record = await ctx.db.get(args.vaccinationId);
    if (!record || record.shopId !== shopId) throw new Error("Not found");

    await ctx.db.patch(args.vaccinationId, {
      vaccine_name:      args.vaccine_name.trim(),
      administered_date: args.administered_date,
      due_date:          args.due_date || undefined,
      vet_clinic:        args.vet_clinic?.trim() || undefined,
      vet_phone:         args.vet_phone?.trim() || undefined,
      notes:             args.notes?.trim() || undefined,
      updated_at:        Date.now(),
    });
  },
});

export const deleteVaccination = mutation({
  args: { vaccinationId: v.id("vaccinations") },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);
    const record = await ctx.db.get(args.vaccinationId);
    if (!record || record.shopId !== shopId) throw new Error("Not found");
    await ctx.db.delete(args.vaccinationId);
  },
});
