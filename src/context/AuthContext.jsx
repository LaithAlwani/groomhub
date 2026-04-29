import { createContext, useContext, useEffect, useState } from "react";
import { useUser, useOrganization, useOrganizationList, useClerk, useSession } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      </div>
      <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
    </div>
  );
}

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

  // Auto-create the Convex shop record when a user has an org but no shop yet.
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

  const membershipsReady = orgListLoaded && userMemberships?.isLoading === false;

  if (!userLoaded || (isSignedIn && (!orgLoaded || !membershipsReady))) return <LoadingScreen />;
  if (orgRole && !shopLoaded) return <LoadingScreen />;

  const needsShopSelection = isSignedIn && membershipsReady && !orgRole;

  return (
    <AuthContext.Provider value={{ user, logout, needsShopSelection, shopCreateError, setPendingLogoStorageId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
