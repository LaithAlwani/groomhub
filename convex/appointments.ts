import { query, mutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireSession, requireAdmin } from "./sessions";
import { Id } from "./_generated/dataModel";

// Recompute last_visit_date / last_visit_text on the client from their appointments.
// Finds the appointment with the latest date string; falls back to most recent by creation.
async function refreshLastVisit(ctx: MutationCtx, contactId: Id<"clients">) {
  const all = await ctx.db
    .query("appointments")
    .withIndex("by_contact_and_date", (q) => q.eq("contact_id", contactId))
    .collect();

  const withDate = all.filter((a) => !!a.date);
  withDate.sort((a, b) => (b.date! > a.date! ? 1 : -1));

  const latest = withDate[0] ?? all.sort((a, b) => b._creationTime - a._creationTime)[0];

  await ctx.db.patch(contactId, {
    last_visit_date: latest?.date,
    last_visit_text: latest?.note_text,
  });
}

export const backfillLastVisits = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const clients = await ctx.db.query("clients").collect();
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
    return await ctx.db
      .query("appointments")
      .withIndex("by_contact_and_date", (q) =>
        q.eq("contact_id", args.contactId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const addAppointment = mutation({
  args: {
    sessionToken: v.string(),
    contactId:    v.id("clients"),
    petId:        v.optional(v.id("pets")),
    date:         v.optional(v.string()),
    note_text:    v.string(),
    groomer:      v.optional(v.string()),
    price:        v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSession(ctx, args.sessionToken);

    const note = args.note_text.trim();
    if (!note) throw new Error("Note is required");

    await ctx.db.insert("appointments", {
      contact_id:  args.contactId,
      pet_id:      args.petId,
      date:        args.date?.trim() || undefined,
      note_text:   note,
      groomer:     args.groomer?.trim() || undefined,
      price:       args.price,
      createdBy:   user.displayName,
      createdById: user._id,
      created_at:  Date.now(),
    });

    await refreshLastVisit(ctx, args.contactId);
  },
});

export const updateAppointment = mutation({
  args: {
    sessionToken:  v.string(),
    appointmentId: v.id("appointments"),
    petId:         v.optional(v.id("pets")),
    date:          v.optional(v.string()),
    note_text:     v.string(),
    groomer:       v.optional(v.string()),
    price:         v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSession(ctx, args.sessionToken);

    const appt = await ctx.db.get(args.appointmentId);
    if (!appt) throw new Error("Appointment not found");

    if (!user.isAdmin && appt.createdById !== user._id) {
      throw new Error("Forbidden: you can only edit your own appointments");
    }

    const note = args.note_text.trim();
    if (!note) throw new Error("Note is required");

    await ctx.db.patch(args.appointmentId, {
      pet_id:    args.petId,
      date:      args.date?.trim() || undefined,
      note_text: note,
      groomer:   args.groomer?.trim() || undefined,
      price:     args.price,
      editedBy:  user.displayName,
      editedById: user._id,
      edited_at: Date.now(),
    });

    await refreshLastVisit(ctx, appt.contact_id);
  },
});

export const deleteAppointment = mutation({
  args: {
    sessionToken:  v.string(),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const appt = await ctx.db.get(args.appointmentId);
    if (!appt) throw new Error("Appointment not found");
    await ctx.db.delete(args.appointmentId);

    await refreshLastVisit(ctx, appt.contact_id);
  },
});
