// Convex's identity.tokenIdentifier is "<issuer>|<subject>" (e.g.
// "https://big-ray-65.clerk.accounts.dev|user_2abc"), but Clerk's client API
// (clerkUser.id, membership.publicUserData.userId) only exposes the bare subject.
// Use this helper any time client code needs to match a user identity from
// Clerk against an ID that came from Convex (e.g. appt.createdById,
// appt.groomerId, users.tokenIdentifier from listGroomers).
export function matchesUser(serverId, bareUserId) {
  if (!serverId || !bareUserId) return false;
  return serverId === bareUserId || serverId.endsWith(`|${bareUserId}`);
}
