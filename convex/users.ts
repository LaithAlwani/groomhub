import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireShopAccess, requireAdmin, isAdminRole } from "./sessions";

// Allowed values for users.color. Keep in sync with src/constants/groomerColors.js.
const ALLOWED_COLORS = ["rose", "amber", "emerald", "sky", "violet", "fuchsia", "cyan", "lime"];

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

// Returns groomer options for the appointment form / schedule filter.
// Admins see all shop staff; non-admins see only themselves so the dropdown
// (and any client devtools probe) cannot reveal other staff identities.
export const listGroomers = query({
  args: {},
  handler: async (ctx) => {
    const { identity, shopId } = await requireShopAccess(ctx);
    const isAdmin = isAdminRole(identity["org_role"] as string | undefined);

    const users = await ctx.db
      .query("users")
      .withIndex("by_shop", (q) => q.eq("shopId", shopId))
      .take(100);

    const visible = isAdmin
      ? users
      : users.filter((u) => u.tokenIdentifier === identity.tokenIdentifier);

    return visible
      .map((u) => ({
        _id:             u._id,
        displayName:     u.displayName,
        tokenIdentifier: u.tokenIdentifier,
        color:           u.color ?? null,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

// Admin-only: set the schedule color for a staff member in this shop.
export const setUserColor = mutation({
  args: {
    userId: v.id("users"),
    color:  v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const { shopId } = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target || target.shopId !== shopId) throw new Error("User not found");
    if (args.color !== null && !ALLOWED_COLORS.includes(args.color)) {
      throw new Error("Invalid color");
    }
    await ctx.db.patch(args.userId, { color: args.color ?? undefined });
  },
});
