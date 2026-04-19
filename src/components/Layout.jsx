import Icon from "../assets/Icon";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboards", icon: "dashboard" },
  { id: "clients",   label: "Clients",    icon: "clients"   },
  { id: "schedule",  label: "Schedule",   icon: "schedule"  },
  { id: "settings",  label: "Settings",   icon: "settings"  },
];

export default function Layout({ page, onNavigate, searchQuery, onSearch, showSearch, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-44 shrink-0 flex flex-col text-neutral-400">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <span className="text-xl text-neutral-700 font-bold  tracking-tight">GroomHub</span>
          <p className="text-sidebar-item text-xs mt-0.5 font-medium tracking-widest uppercase">
            Internal Portal
          </p>
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
          <div className="flex-1">
            {showSearch && (
              <div className="relative">
                <Icon
                  name="search"
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search clients or pets…"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-64 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                />
              </div>
            )}
          </div>

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
