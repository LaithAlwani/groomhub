import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireShopAccess } from "./sessions";

// Pet/client appointment history is intentionally NOT filtered by groomer ownership:
// any shop staff viewing a client detail page needs the full grooming history for
// service-quality context (past services, notes, who groomed them previously).
// The role-based visibility rule applies to the schedule view, not pet history.
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
