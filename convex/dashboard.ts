import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireSession } from "./sessions";

function todayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function weekRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  };
}

export const getStats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.sessionToken);

    const today = todayString();
    const week  = weekRange();

    const todayAppts = await ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    const weekAppts = await ctx.db
      .query("appointments")
      .withIndex("by_date", (q) => q.gte("date", week.start).lte("date", week.end))
      .collect();

    const weekRevenue      = weekAppts.reduce((sum, a) => sum + (a.price ?? 0), 0);
    const todayClientCount = new Set(todayAppts.map((a) => a.contact_id.toString())).size;

    return {
      todayAppointments: todayAppts.length,
      weekAppointments:  weekAppts.length,
      weekRevenue,
      todayClients: todayClientCount,
    };
  },
});

export const getRecentActivity = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.sessionToken);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date")
      .order("desc")
      .take(10);

    return await Promise.all(
      appointments.map(async (appt) => {
        const client = await ctx.db.get(appt.contact_id);
        const pet    = appt.pet_id ? await ctx.db.get(appt.pet_id) : null;
        return {
          _id:      appt._id,
          date:     appt.date,
          groomer:  appt.groomer,
          price:    appt.price,
          clientName: client?.client_name ?? "Unknown",
          petName:    pet?.name  ?? null,
          petBreed:   pet?.breed ?? null,
        };
      })
    );
  },
});
