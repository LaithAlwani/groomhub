import { query, mutation, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { createSession, requireSession, requireAdmin } from "./sessions";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const MAX_FAILED_ATTEMPTS = 3;

export const login = mutation({
  args: {
    username: v.string(),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (!user) return { ok: false as const, error: "Wrong username or PIN." };

    const attempts = user.failed_attempts ?? 0;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      return { ok: false as const, error: "Account locked. Contact an administrator." };
    }

    const pinHash = await hashPin(args.pin);

    if (user.passcode !== pinHash) {
      const newAttempts = attempts + 1;
      // Patch BEFORE returning so the write commits (throwing would roll it back)
      await ctx.db.patch(user._id, { failed_attempts: newAttempts });
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        return { ok: false as const, error: "Account locked. Contact an administrator." };
      }
      return { ok: false as const, error: "Wrong username or PIN." };
    }

    await ctx.db.patch(user._id, { failed_attempts: 0 });

    const sessionToken = await createSession(ctx, user._id);

    return {
      ok:          true as const,
      sessionToken,
      userId:      user._id,
      displayName: user.displayName,
      isAdmin:     user.isAdmin,
    };
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

// ─── User Management (admin-only) ────────────────────────────────────────────

export const listGroomers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireSession(ctx, args.sessionToken);
    const users = await ctx.db.query("users").collect();
    return users
      .map((u) => ({ _id: u._id, displayName: u.displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

export const listUsers = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const users = await ctx.db.query("users").collect();
    // Never expose the hashed passcode
    return users
      .map(({ passcode: _p, ...u }) => u)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

export const createUser = mutation({
  args: {
    sessionToken: v.string(),
    displayName:  v.string(),
    username:     v.string(),
    pin:          v.string(),
    isAdmin:      v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const displayName = args.displayName.trim();
    const username    = args.username.trim().toLowerCase();
    if (!displayName) throw new Error("Display name is required");
    if (!username)    throw new Error("Username is required");
    if (!args.pin)    throw new Error("Passcode is required");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (existing) throw new Error("Username is already taken");

    const pinHash = await hashPin(args.pin);
    await ctx.db.insert("users", {
      displayName,
      username,
      passcode: pinHash,
      isAdmin: args.isAdmin,
      failed_attempts: 0,
    });
  },
});

export const updateUser = mutation({
  args: {
    sessionToken: v.string(),
    userId:       v.id("users"),
    displayName:  v.optional(v.string()),
    username:     v.optional(v.string()),
    pin:          v.optional(v.string()),
    isAdmin:      v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    const patch: {
      displayName?: string;
      username?: string;
      passcode?: string;
      isAdmin?: boolean;
    } = {};

    if (args.displayName !== undefined) {
      const name = args.displayName.trim();
      if (!name) throw new Error("Display name cannot be empty");
      patch.displayName = name;
    }
    if (args.username !== undefined) {
      const u = args.username.trim().toLowerCase();
      if (!u) throw new Error("Username cannot be empty");
      const conflict = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", u))
        .unique();
      if (conflict && conflict._id !== args.userId)
        throw new Error("Username is already taken");
      patch.username = u;
    }
    if (args.pin) {
      patch.passcode = await hashPin(args.pin);
    }
    if (args.isAdmin !== undefined) {
      patch.isAdmin = args.isAdmin;
    }

    await ctx.db.patch(args.userId, patch);
  },
});

export const deleteUser = mutation({
  args: {
    sessionToken: v.string(),
    userId:       v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.sessionToken);

    if (admin._id === args.userId)
      throw new Error("You cannot delete your own account");

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    if (target.isAdmin) {
      const allAdmins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("isAdmin"), true))
        .collect();
      if (allAdmins.length <= 1)
        throw new Error("Cannot delete the only admin account");
    }

    // Invalidate all active sessions for the deleted user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);

    await ctx.db.delete(args.userId);
  },
});

export const resetLockout = mutation({
  args: { sessionToken: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    await ctx.db.patch(args.userId, { failed_attempts: 0 });
  },
});

// ─── Internal (dashboard only) ────────────────────────────────────────────────

// Run once from the Convex dashboard to create the first admin.
// Call with: { username: "admin", pin: "YOUR_PIN", displayName: "Your Name" }
export const createInitialAdmin = internalMutation({
  args: {
    username: v.string(),
    pin: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existing) throw new Error("User already exists");

    const pinHash = await hashPin(args.pin);
    await ctx.db.insert("users", {
      username,
      displayName: args.displayName,
      passcode: pinHash,
      isAdmin: true,
    });
  },
});

export const unlockUser = internalMutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) =>
        q.eq("username", args.username.trim().toLowerCase()),
      )
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { failed_attempts: 0 });
  },
});
