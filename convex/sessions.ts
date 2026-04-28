import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity;
}

export async function requireShopAccess(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const orgId = identity["org_id"] as string | undefined;
  if (!orgId) throw new Error("No organization in token");
  const shop = await ctx.db
    .query("shops")
    .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", orgId))
    .unique();
  if (!shop) throw new Error("Shop not found");
  return { identity, shop, shopId: shop._id as Id<"shops"> };
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const result = await requireShopAccess(ctx);
  const role = result.identity["org_role"] as string | undefined;
  if (role !== "org:admin" && role !== "org:super_admin") throw new Error("Forbidden");
  return result;
}

export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const result = await requireShopAccess(ctx);
  if ((result.identity["org_role"] as string) !== "org:super_admin") throw new Error("Forbidden");
  return result;
}
