import { useState } from "react";
import { useOrganization, useOrganizationList } from "@clerk/react";
import Icon from "../assets/Icon";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboards", icon: "dashboard" },
  { id: "clients",   label: "Clients",    icon: "clients"   },
  { id: "prices",    label: "Prices",     icon: "dollar"    },
  { id: "schedule",  label: "Schedule",   icon: "schedule"  },
  { id: "settings",  label: "Settings",   icon: "settings"  },
];

export default function Layout({ page, onNavigate, children }) {
  const { user, logout } = useAuth();
  const { organization }  = useOrganization();
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: { pageSize: 50 },
  });

  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [switchingId,  setSwitchingId]  = useState(null);

  const memberships   = userMemberships?.data ?? [];
  const isMultiShop   = isLoaded && !userMemberships?.isLoading && memberships.length > 1;
  const currentOrgId  = organization?.id;

  async function handleSwitchShop(orgId) {
    if (switchingId || orgId === currentOrgId) { setShopMenuOpen(false); return; }
    setSwitchingId(orgId);
    setShopMenuOpen(false);
    try {
      await setActive({ organization: orgId });
    } finally {
      setSwitchingId(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Backdrop to close shop menu */}
      {shopMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setShopMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className="w-44 shrink-0 flex flex-col text-neutral-400">

        {/* Logo / Shop switcher */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10 relative z-50">
          <span className="text-base text-neutral-700 font-bold tracking-tight">GroomHub</span>

          {isMultiShop ? (
            <>
              <button
                onClick={() => setShopMenuOpen((o) => !o)}
                className="flex items-center gap-1 mt-0.5 group max-w-full"
              >
                <p className="text-sidebar-item text-xs font-medium truncate">
                  {switchingId ? "Switching…" : (user?.shopName ?? "Select shop")}
                </p>
                <Icon
                  name="chevron-left"
                  className={`w-3 h-3 text-sidebar-item shrink-0 transition-transform ${shopMenuOpen ? "rotate-90" : "-rotate-90"}`}
                />
              </button>

              {shopMenuOpen && (
                <div className="absolute left-2 right-2 top-full mt-1 bg-background-card border border-border rounded-xl shadow-soft overflow-hidden">
                  {memberships.map((m) => {
                    const org       = m.organization;
                    const isCurrent = org.id === currentOrgId;
                    return (
                      <button
                        key={org.id}
                        onClick={() => handleSwitchShop(org.id)}
                        disabled={!!switchingId}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors disabled:opacity-50 ${
                          isCurrent
                            ? "bg-primary-light text-primary font-semibold"
                            : "hover:bg-ui-hover text-text-primary"
                        }`}
                      >
                        <div className="w-5 h-5 rounded-md bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
                          {org.imageUrl ? (
                            <img src={org.imageUrl} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="scissors" className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <span className="truncate flex-1">{org.name}</span>
                        {switchingId === org.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin text-primary shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                          </svg>
                        ) : isCurrent ? (
                          <Icon name="check" className="w-3.5 h-3.5 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="text-sidebar-item text-xs mt-0.5 font-medium truncate">
              {user?.shopName ?? "Internal Portal"}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                  active
                    ? "bg-primary-light text-primary"
                    : "hover:bg-neutral-100 hover:text-neutral-700"
                }`}
              >
                <Icon name={item.icon} className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}

          {user?.isAdmin && (
            <button
              onClick={() => onNavigate("admin")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                page === "admin"
                  ? "bg-primary-light text-primary"
                  : "hover:bg-neutral-100 hover:text-neutral-700"
              }`}
            >
              <Icon name="shield" className="w-4 h-4 shrink-0" />
              Admin
            </button>
          )}
        </nav>

        {/* User row */}
        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sidebar-item text-xs truncate flex-1">
            {user?.displayName}
          </span>
          <button
            onClick={logout}
            title="Log out"
            className="text-sidebar-item hover:text-neutral-700 transition-colors"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background-card border-b border-border px-6 h-14 flex items-center gap-4 shrink-0">
          <div className="flex-1" />
          <button className="text-sm text-text-secondary hover:text-text-primary font-medium transition-colors">
            Support
          </button>
          <button className="text-text-muted hover:text-text-secondary transition-colors">
            <Icon name="bell" className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
