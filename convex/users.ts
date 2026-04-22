import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createSession, requireSession, requireAdmin, requireSuperAdmin } from "./sessions";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const MAX_FAILED_ATTEMPTS = 3;

const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("staff"),
);

export const hasAnyUsers = query({
  args: {},
  handler: async (ctx) => {
    const first = await ctx.db.query("users").first();
    return first !== null;
  },
});

export const bootstrapSuperAdmin = mutation({
  args: {
    displayName: v.string(),
    username:    v.string(),
    pin:         v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").first();
    if (existing) throw new Error("Setup already complete. Please log in.");

    const displayName = args.displayName.trim();
    const username    = args.username.trim().toLowerCase();
    if (!displayName) throw new Error("Display name is required");
    if (!username)    throw new Error("Username is required");
    if (!args.pin || args.pin.length < 4) throw new Error("Passcode must be at least 4 characters");

    const pinHash = await hashPin(args.pin);
    await ctx.db.insert("users", {
      displayName,
      username,
      passcode: pinHash,
      role: "super_admin",
      failed_attempts: 0,
    });
  },
});

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
      role:        user.role,
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

// ─── User Management ─────────────────────────────────────────────────────────

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
    role:         roleValidator,
  },
  handler: async (ctx, args) => {
    const caller = await requireAdmin(ctx, args.sessionToken);

    // Only super_admins can create super_admin accounts
    if (args.role === "super_admin" && caller.role !== "super_admin") {
      throw new Error("Forbidden: only super admins can create super admin accounts");
    }

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
      role: args.role,
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
    role:         v.optional(roleValidator),
  },
  handler: async (ctx, args) => {
    const caller = await requireAdmin(ctx, args.sessionToken);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    // Admins cannot modify super_admin accounts — only super_admins can
    if (target.role === "super_admin" && caller.role !== "super_admin") {
      throw new Error("Forbidden: only super admins can edit super admin accounts");
    }

    // Admins cannot promote anyone to super_admin
    if (args.role === "super_admin" && caller.role !== "super_admin") {
      throw new Error("Forbidden: only super admins can assign the super admin role");
    }

    const patch: {
      displayName?: string;
      username?: string;
      passcode?: string;
      role?: "super_admin" | "admin" | "staff";
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
    if (args.role !== undefined) {
      patch.role = args.role;
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
    const caller = await requireSuperAdmin(ctx, args.sessionToken);

    if (caller._id === args.userId)
      throw new Error("You cannot delete your own account");

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    // Prevent deleting the last super_admin
    if (target.role === "super_admin") {
      const allSuperAdmins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "super_admin"))
        .collect();
      if (allSuperAdmins.length <= 1)
        throw new Error("Cannot delete the only super admin account");
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

export const createInitialAdmin = internalMutation({
  args: {
    username:    v.string(),
    pin:         v.string(),
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
      role: "super_admin",
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
