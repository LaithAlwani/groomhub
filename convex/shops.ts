import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireShopAccess, requireSuperAdmin } from "./sessions";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Called from AuthContext right after Clerk org is created.
// Idempotent — returns existing shop id if the org already has a record.
export const createShop = mutation({
  args: {
    name:          v.string(),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const orgId = identity["org_id"] as string | undefined;
    if (!orgId) throw new Error("No organization in token");

    const existing = await ctx.db
      .query("shops")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", orgId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("shops", {
      clerkOrgId:    orgId,
      name:          args.name.trim(),
      slug:          toSlug(args.name),
      plan:          "trial",
      logoStorageId: args.logoStorageId,
      createdAt:     Date.now(),
    });
  },
});

// Returns the shop for the calling user's Clerk org, or null if not found.
// Safe to call before a shop exists (used in AuthContext to detect needsShop).
export const getMyShop = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const orgId = identity["org_id"] as string | undefined;
    if (!orgId) return null;
    return await ctx.db
      .query("shops")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", orgId))
      .unique();
  },
});

// Generates a short-lived upload URL for the shop logo.
// Only requires auth (not super admin) so it works during initial onboarding before the shop exists.
export const generateLogoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Saves the storage ID after a successful logo upload.
export const saveShopLogo = mutation({
  args: { logoStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const { shopId } = await requireSuperAdmin(ctx);
    await ctx.db.patch(shopId, { logoStorageId: args.logoStorageId });
  },
});

// Returns the public URL for the shop's logo, or null.
export const getLogoUrl = query({
  args: {},
  handler: async (ctx) => {
    const { shop } = await requireShopAccess(ctx);
    if (!shop.logoStorageId) return null;
    return await ctx.storage.getUrl(shop.logoStorageId);
  },
});
