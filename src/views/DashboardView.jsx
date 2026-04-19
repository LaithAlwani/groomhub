import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

function StatCard({ icon, label, value, adminOnly, isAdmin, comingSoon }) {
  return (
    <div className="bg-background-card border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 text-text-muted mb-3">
        <Icon name={icon} className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-widest">{label}</span>
      </div>
      {comingSoon ? (
        <>
          <p className="text-2xl font-bold text-text-muted">—</p>
          <p className="text-xs text-text-muted mt-1 italic">Coming soon</p>
        </>
      ) : adminOnly && !isAdmin ? (
        <p className="text-2xl font-bold text-text-muted">—</p>
      ) : (
        <p className="text-2xl font-bold text-text-primary">
          {value ?? <span className="text-text-muted">—</span>}
        </p>
      )}
    </div>
  );
}

export default function DashboardView() {
  const { user } = useAuth();
  const stats    = useQuery(api.dashboard.getStats,         { sessionToken: user.sessionToken });
  const activity = useQuery(api.dashboard.getRecentActivity, { sessionToken: user.sessionToken });

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const firstName = user?.displayName?.split(" ")[0] ?? user?.displayName;

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Good {greeting}, {firstName}.
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Here's what's happening at the studio today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="calendar"
          label="Today's Appointments"
          comingSoon
        />
        <StatCard
          icon="schedule"
          label="Pending Approvals"
          comingSoon
        />
        <StatCard
          icon="clients"
          label="Today's Clients"
          value={stats?.todayClients}
        />
        <StatCard
          icon="dollar"
          label="Weekly Revenue"
          value={stats?.weekRevenue != null ? `$${stats.weekRevenue.toFixed(2)}` : undefined}
          adminOnly
          isAdmin={user?.isAdmin}
        />
      </div>

      {/* Recent activity */}
      <section>
        <h2 className="text-subtitle text-text-primary flex items-center gap-2 mb-4">
          <Icon name="scissors" className="w-5 h-5 text-text-muted" />
          Recent Grooming Activity
        </h2>

        {activity === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-background-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-text-muted">No recent activity yet.</p>
        ) : (
          <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-sidebar">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Pet</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Groomer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activity.map((appt) => (
                  <tr key={appt._id} className="hover:bg-ui-hover transition-colors">
                    <td className="px-5 py-3 font-medium text-text-primary whitespace-nowrap">
                      {appt.clientName}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {appt.petName
                        ? <>
                            {appt.petName}
                            {appt.petBreed && (
                              <span className="text-text-muted text-xs ml-1">({appt.petBreed})</span>
                            )}
                          </>
                        : <span className="text-text-muted">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {appt.groomer ?? <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3 text-text-muted whitespace-nowrap">
                      {appt.date ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-primary">
                      {appt.price != null
                        ? `$${appt.price.toFixed(2)}`
                        : <span className="text-text-muted">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
