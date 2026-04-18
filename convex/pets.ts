import { query } from "./_generated/server";
import { v } from "convex/values";

export const getPetsByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pets")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contactId))
      .take(50);
  },
});
