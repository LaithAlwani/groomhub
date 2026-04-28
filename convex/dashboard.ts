import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireShopAccess } from "./sessions";

function weekRange(today: string) {
  const now  = new Date(today);
  const day  = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const pad = (d: Date) => d.toISOString().slice(0, 10);
  return { start: pad(start), end: pad(end) };
}

export const getStats = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const { shopId } = await requireShopAccess(ctx);
    const today = args.today;
    const week  = weekRange(today);

    const todayAppts = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_date", (q) =>
        q.eq("shopId", shopId).eq("date", today),
      )
      .take(1000);

    const weekAppts = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_date", (q) =>
        q.eq("shopId", shopId).gte("date", week.start).lte("date", week.end),
      )
      .take(1000);

    const weekRevenue = weekAppts.reduce((sum, a) => sum + (a.price ?? 0), 0);

    return {
      todayAppointments: todayAppts.length,
      weekAppointments:  weekAppts.length,
      weekRevenue,
      todayClients:      todayAppts.length,
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const { shopId } = await requireShopAccess(ctx);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_date", (q) => q.eq("shopId", shopId))
      .order("desc")
      .take(10);

    return await Promise.all(
      appointments.map(async (appt) => {
        const client = await ctx.db.get(appt.contact_id);
        const pet    = appt.pet_id ? await ctx.db.get(appt.pet_id) : null;
        return {
          _id:        appt._id,
          date:       appt.date,
          groomer:    appt.groomer,
          price:      appt.price,
          clientName: client?.client_name ?? "Unknown",
          petName:    pet?.name  ?? null,
          petBreed:   pet?.breed ?? null,
        };
      }),
    );
  },
});
