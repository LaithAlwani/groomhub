import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireShopAccess, isAdminRole, canSeeAppt } from "./sessions";

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
    const { identity, shopId } = await requireShopAccess(ctx);
    const isAdmin = isAdminRole(identity["org_role"] as string | undefined);
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

    const weekFiltered = isAdmin
      ? weekAppts
      : weekAppts.filter((a) => canSeeAppt(a, identity.tokenIdentifier));
    const weekRevenue = weekFiltered.reduce((sum, a) => sum + (a.price ?? 0), 0);

    const todayFiltered = todayAppts.filter(
      (a) => a.status !== "cancelled" && a.status !== "no_show" && (isAdmin || canSeeAppt(a, identity.tokenIdentifier)),
    );

    const pendingAppts = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_status", (q) =>
        q.eq("shopId", shopId).eq("status", "pending"),
      )
      .take(500);

    const pendingFiltered = isAdmin
      ? pendingAppts
      : pendingAppts.filter((a) => canSeeAppt(a, identity.tokenIdentifier));

    return {
      todayAppointments: todayFiltered.length,
      weekAppointments:  weekFiltered.length,
      weekRevenue,
      todayClients:      todayFiltered.length,
      pendingApprovals:  pendingFiltered.length,
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const { identity, shopId } = await requireShopAccess(ctx);
    const isAdmin = isAdminRole(identity["org_role"] as string | undefined);

    const sample = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_date", (q) => q.eq("shopId", shopId))
      .order("desc")
      .take(isAdmin ? 10 : 50);

    const appointments = (isAdmin
      ? sample
      : sample.filter((a) => canSeeAppt(a, identity.tokenIdentifier))
    ).slice(0, 10);

    return await Promise.all(
      appointments.map(async (appt) => {
        const client = await ctx.db.get(appt.contact_id);
        const pet    = appt.pet_id ? await ctx.db.get(appt.pet_id) : null;
        return {
          _id:        appt._id,
          date:       appt.date,
          groomer:    appt.groomer,
          price:      appt.price,
          status:     appt.status ?? "completed",
          clientName: client?.client_name ?? "Unknown",
          petName:    pet?.name  ?? null,
          petBreed:   pet?.breed ?? null,
        };
      }),
    );
  },
});
