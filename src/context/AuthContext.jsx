import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useOrganization, useOrganizationList, useClerk, useSession } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user: clerkUser, isSignedIn, isLoaded: userLoaded } = useUser();
  const { membership, organization, isLoaded: orgLoaded } = useOrganization();
  const {
    userMemberships,
    setActive: setActiveOrg,
    isLoaded: orgListLoaded,
  } = useOrganizationList({ userMemberships: { pageSize: 50 } });
  const { signOut }    = useClerk();
  const { session }    = useSession();
  const upsertUser     = useMutation(api.users.upsertUser);
  const createShopMut  = useMutation(api.shops.createShop);
  const shop           = useQuery(api.shops.getMyShop);

  const orgRole    = membership?.role;
  const shopLoaded = shop !== undefined;
  const [shopCreateError,      setShopCreateError]      = useState(null);
  const [pendingLogoStorageId, setPendingLogoStorageId] = useState(null);

  const user =
    isSignedIn && orgLoaded && orgRole && shop
      ? {
          userId:            clerkUser.id,
          tokenIdentifier:   clerkUser.id,
          displayName:
            clerkUser.fullName ??
            clerkUser.primaryEmailAddress?.emailAddress ??
            "User",
          role:         orgRole,
          isAdmin:      orgRole === "org:admin" || orgRole === "org:super_admin",
          isSuperAdmin: orgRole === "org:super_admin",
          shopId:       shop._id,
          shopName:     shop.name,
          shopLogoStorageId: shop.logoStorageId,
        }
      : null;

  // Auto-activate the only org when there's exactly one and none is currently active.
  // Avoids showing the shop picker for single-shop users.
  useEffect(() => {
    if (!isSignedIn || !orgListLoaded || orgRole) return;
    const memberships = userMemberships?.data ?? [];
    if (memberships.length !== 1) return;
    setActiveOrg({ organization: memberships[0].organization.id }).catch(() => {});
  }, [isSignedIn, orgListLoaded, orgRole, userMemberships?.data?.length, setActiveOrg]);

  // Auto-create the Convex shop record when a user has an org but no shop yet.
  // Forces a fresh Clerk token before each attempt so Convex sees org_id in the JWT.
  useEffect(() => {
    if (!orgRole || shop !== null || !organization?.id || !organization?.name || !session) return;

    let cancelled = false;
    let attempt   = 0;
    const MAX_ATTEMPTS = 8;

    async function tryCreate() {
      if (cancelled) return;
      if (attempt >= MAX_ATTEMPTS) {
        setShopCreateError(
          "Could not set up your shop automatically. Please sign out and sign back in, or contact support."
        );
        return;
      }
      try {
        await session.getToken({ template: "convex" });
        await createShopMut({
          name:          organization.name,
          logoStorageId: pendingLogoStorageId ?? undefined,
        });
      } catch {
        if (!cancelled) {
          attempt += 1;
          const delay = Math.min(1000 * attempt, 5000);
          setTimeout(tryCreate, delay);
        }
      }
    }

    tryCreate();
    return () => { cancelled = true; };
  }, [orgRole, shop, organization?.id, organization?.name, session, pendingLogoStorageId]);

  // Sync display name into the Convex users table after login or shop creation
  useEffect(() => {
    if (user) {
      upsertUser({}).catch(() => {});
    }
  }, [user?.userId, user?.shopId]);

  async function logout() {
    await signOut();
  }

  // isLoaded goes true before userMemberships.data is populated — wait for the
  // paginated fetch to finish too, otherwise membershipCount is 0 for one frame
  // and needsShop flashes CreateShopView before needsShopSelection can take over.
  const membershipsReady = orgListLoaded && userMemberships?.isLoading === false;

  // Hold rendering until Clerk + org list are fully resolved
  if (!userLoaded || (isSignedIn && (!orgLoaded || !membershipsReady))) return null;
  if (orgRole && !shopLoaded) return null;

  const membershipCount    = userMemberships?.data?.length ?? 0;
  const needsShopSelection = isSignedIn && membershipsReady && !orgRole && membershipCount > 1;
  const needsShop          = isSignedIn && orgLoaded && membershipsReady && !orgRole && membershipCount === 0;

  return (
    <AuthContext.Provider value={{ user, logout, needsShop, needsShopSelection, shopCreateError, setPendingLogoStorageId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
