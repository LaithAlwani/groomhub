import { useState } from "react";
import { useOrganizationList, useClerk } from "@clerk/react";
import Icon from "../assets/Icon";

const ROLE_LABEL = {
  "org:super_admin": "Super Admin",
  "org:admin":       "Admin",
  "org:member":      "Staff",
};

const ROLE_BADGE = {
  "org:super_admin": "bg-yellow-100 text-yellow-700",
  "org:admin":       "bg-primary-light text-primary",
  "org:member":      "bg-border text-text-secondary",
};

export default function SelectShopView() {
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: { pageSize: 50 },
  });
  const { signOut } = useClerk();
  const [activatingId, setActivatingId] = useState(null);

  // isLoaded goes true before userMemberships.data is populated
  const membershipsReady = isLoaded && userMemberships?.isLoading === false;
  const memberships      = userMemberships?.data ?? [];

  async function handleSelect(orgId) {
    if (activatingId) return;
    setActivatingId(orgId);
    try {
      await setActive({ organization: orgId });
      // AuthContext re-evaluates: needsShopSelection drops to false, main app renders
    } catch {
      setActivatingId(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="scissors" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">GroomHub</h1>
          <p className="text-sm text-text-muted mt-1">Select your shop to continue</p>
        </div>

        {!membershipsReady ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-background-sidebar rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => {
              const org          = m.organization;
              const isActivating = activatingId === org.id;

              return (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  disabled={!!activatingId}
                  className="w-full bg-background-card border border-border rounded-2xl shadow-card p-4 text-left hover:border-primary/50 hover:shadow-soft transition-all disabled:opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
                      {org.imageUrl ? (
                        <img
                          src={org.imageUrl}
                          alt={org.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <Icon name="scissors" className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">{org.name}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${ROLE_BADGE[m.role] ?? ROLE_BADGE["org:member"]}`}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isActivating ? (
                        <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                      ) : (
                        <Icon name="chevron-left" className="w-5 h-5 text-text-muted rotate-180" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => signOut()}
          className="mt-6 w-full text-xs text-text-muted hover:text-text-secondary transition-colors text-center"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
