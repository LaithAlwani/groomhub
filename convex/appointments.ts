import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireSession, requireAdmin } from "./sessions";

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
    });
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
  },
});
