import { mutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireSuperAdmin } from "./sessions";
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
