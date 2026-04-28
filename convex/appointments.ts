import { query, mutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireShopAccess, requireAdmin, requireSuperAdmin } from "./sessions";
import { Id } from "./_generated/dataModel";

async function refreshLastVisit(ctx: MutationCtx, contactId: Id<"clients">) {
  const all = await ctx.db
    .query("appointments")
    .withIndex("by_contact_and_date", (q) => q.eq("contact_id", contactId))
    .take(1000);

  const withDate = all.filter((a) => !!a.date);
  withDate.sort((a, b) => (b.date! > a.date! ? 1 : -1));

  const latest =
    withDate[0] ?? all.sort((a, b) => b._creationTime - a._creationTime)[0];

  await ctx.db.patch(contactId, {
    last_visit_date: latest?.date,
    last_visit_text: latest?.note_text,
  });
}

export const backfillLastVisits = mutation({
  args: {},
  handler: async (ctx) => {
    const { shopId } = await requireAdmin(ctx);
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_shop_and_name", (q) => q.eq("shopId", shopId))
      .take(10000);
    for (const client of clients) {
      await refreshLastVisit(ctx, client._id);
    }
    return clients.length;
  },
});

export const getAppointmentsByContact = query({
  args: {
    contactId:      v.id("clients"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);
    const client = await ctx.db.get(args.contactId);
    if (!client || client.shopId !== shopId) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    return await ctx.db
      .query("appointments")
      .withIndex("by_contact_and_date", (q) => q.eq("contact_id", args.contactId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const addAppointment = mutation({
  args: {
    contactId: v.id("clients"),
    petId:     v.optional(v.id("pets")),
    date:      v.optional(v.string()),
    note_text: v.string(),
    groomer:   v.optional(v.string()),
    price:     v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireShopAccess(ctx);

    const client = await ctx.db.get(args.contactId);
    if (!client || client.shopId !== shopId) throw new Error("Client not found");

    const note = args.note_text.trim();
    if (!note) throw new Error("Note is required");

    await ctx.db.insert("appointments", {
      shopId,
      contact_id:  args.contactId,
      pet_id:      args.petId,
      date:        args.date?.trim() || undefined,
      note_text:   note,
      groomer:     args.groomer?.trim() || undefined,
      price:       args.price,
      createdBy:   identity.name ?? identity.email ?? "Unknown",
      createdById: identity.tokenIdentifier,
      created_at:  Date.now(),
    });

    await refreshLastVisit(ctx, args.contactId);
  },
});

export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    petId:         v.optional(v.id("pets")),
    date:          v.optional(v.string()),
    note_text:     v.string(),
    groomer:       v.optional(v.string()),
    price:         v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireShopAccess(ctx);

    const appt = await ctx.db.get(args.appointmentId);
    if (!appt || appt.shopId !== shopId) throw new Error("Appointment not found");

    const role = identity["org_role"] as string | undefined;
    const canEditAny = role === "org:admin" || role === "org:super_admin";
    if (!canEditAny && appt.createdById !== identity.tokenIdentifier) {
      throw new Error("Forbidden: you can only edit your own appointments");
    }

    const note = args.note_text.trim();
    if (!note) throw new Error("Note is required");

    await ctx.db.patch(args.appointmentId, {
      pet_id:     args.petId,
      date:       args.date?.trim() || undefined,
      note_text:  note,
      groomer:    args.groomer?.trim() || undefined,
      price:      args.price,
      editedBy:   identity.name ?? identity.email ?? "Unknown",
      editedById: identity.tokenIdentifier,
      edited_at:  Date.now(),
    });

    await refreshLastVisit(ctx, appt.contact_id);
  },
});

export const deleteAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const { shopId } = await requireSuperAdmin(ctx);
    const appt = await ctx.db.get(args.appointmentId);
    if (!appt || appt.shopId !== shopId) throw new Error("Appointment not found");
    await ctx.db.delete(args.appointmentId);
    await refreshLastVisit(ctx, appt.contact_id);
  },
});
