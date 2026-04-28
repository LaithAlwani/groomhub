import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireShopAccess } from "./sessions";

// Syncs the Clerk identity into the shop-scoped users table on every login.
// Used to populate the groomer dropdown in appointments.
export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const orgId = identity["org_id"] as string | undefined;
    if (!orgId) return; // Not in an org yet — skip until shop is created

    const shop = await ctx.db
      .query("shops")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", orgId))
      .unique();
    if (!shop) return; // Shop not created yet — AuthContext will retry

    const displayName =
      identity.name ??
      identity.email ??
      "Unknown";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_shop_and_token", (q) =>
        q.eq("shopId", shop._id).eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("users", {
        shopId:          shop._id,
        tokenIdentifier: identity.tokenIdentifier,
        displayName,
      });
    } else if (existing.displayName !== displayName) {
      await ctx.db.patch(existing._id, { displayName });
    }
  },
});

// Returns all staff for the groomer dropdown, scoped to the calling user's shop.
export const listGroomers = query({
  args: {},
  handler: async (ctx) => {
    const { shopId } = await requireShopAccess(ctx);
    const users = await ctx.db
      .query("users")
      .withIndex("by_shop", (q) => q.eq("shopId", shopId))
      .take(100);
    return users
      .map((u) => ({ _id: u._id, displayName: u.displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});
