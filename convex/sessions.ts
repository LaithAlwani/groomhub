import { MutationCtx, QueryCtx } from "./_generated/server";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Generate a cryptographically random 64-char hex token. */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create a new session for a user and return the token. */
export async function createSession(
  ctx: MutationCtx,
  userId: Parameters<MutationCtx["db"]["insert"]>[0] extends "sessions"
    ? never
    : import("./_generated/dataModel").Id<"users">,
): Promise<string> {
  const token = generateToken();
  await ctx.db.insert("sessions", {
    userId,
    token,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

/**
 * Verify a session token. Returns the user document if valid.
 * Throws a descriptive error if the token is missing, expired, or invalid.
 * Use this at the top of every protected mutation/query.
 */
export async function requireSession(
  ctx: QueryCtx | MutationCtx,
  token: string,
) {
  if (!token) throw new Error("Unauthorized");

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) throw new Error("Unauthorized");
  if (session.expiresAt < Date.now()) throw new Error("Session expired");

  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error("Unauthorized");

  return user;
}

/**
 * Same as requireSession but also asserts the user is an admin.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string,
) {
  const user = await requireSession(ctx, token);
  if (!user.isAdmin) throw new Error("Forbidden");
  return user;
}
