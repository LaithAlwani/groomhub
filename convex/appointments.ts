import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getAppointmentsByContact = query({
  args: {
    contactId: v.id("clients"),
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
