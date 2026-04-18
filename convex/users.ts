import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createSession } from "./sessions";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const MAX_FAILED_ATTEMPTS = 10;

export const login = mutation({
  args: {
    username: v.string(),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    // Use the same error message whether username or PIN is wrong
    // to prevent username enumeration
    if (!user) throw new Error("Invalid credentials");

    const attempts = user.failed_attempts ?? 0;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      throw new Error("Account locked. Contact an administrator.");
    }

    const pinHash = await hashPin(args.pin);

    if (user.passcode !== pinHash) {
      await ctx.db.patch(user._id, { failed_attempts: attempts + 1 });
      throw new Error("Invalid credentials");
    }

    await ctx.db.patch(user._id, { failed_attempts: 0 });

    // Issue a session token — client stores this and passes it with mutations
    const sessionToken = await createSession(ctx, user._id);

    return {
      sessionToken,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
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
