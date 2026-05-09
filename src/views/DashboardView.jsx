import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useDashboardStats } from "../hooks/useDashboardStats";
import Icon from "../assets/Icon";
import StatCard from "../components/StatCard";
import { STATUS_BADGE, STATUS_LABEL } from "../constants/appointments";

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

function ApptRow({ appt }) {
  const status = appt.status ?? "completed";
  return (
    <tr className="hover:bg-ui-hover transition-colors">
      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{appt.clientName}</td>
      <td className="px-4 py-3 text-text-secondary">{appt.petName ?? <span className="text-text-muted">—</span>}</td>
      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
        {appt.date ?? "—"}{appt.time ? ` · ${formatTime(appt.time)}` : ""}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[status] ?? STATUS_BADGE.completed}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </td>
    </tr>
  );
}

function ApptTable({ rows, emptyText, children }) {
  return rows === undefined ? (
    <div className="space-y-2 mt-3">
      {[0,1,2].map((i) => <div key={i} className="h-10 bg-background-sidebar rounded-xl animate-pulse" />)}
    </div>
  ) : rows.length === 0 ? (
    <p className="text-sm text-text-muted mt-3">{emptyText}</p>
  ) : (
    <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background-sidebar">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Client</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Pet</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Date / Time</th>
            {children}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((a) => <ApptRow key={a._id} appt={a} />)}
        </tbody>
      </table>
    </div>
  );
}

function PendingRow({ appt, onApprove, onReject, isAdmin }) {
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading,  setRejectLoading]  = useState(false);
  return (
    <tr className="hover:bg-ui-hover transition-colors">
      <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{appt.clientName}</td>
      <td className="px-4 py-3 text-text-secondary">{appt.petName ?? <span className="text-text-muted">—</span>}</td>
      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
        {appt.date ?? "—"}{appt.time ? ` · ${formatTime(appt.time)}` : ""}
      </td>
      <td className="px-4 py-3 text-text-secondary">{appt.service_type ?? <span className="text-text-muted">—</span>}</td>
      {isAdmin && (
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              disabled={approveLoading || rejectLoading}
              onClick={async () => { setApproveLoading(true); try { await onApprove(appt._id); } finally { setApproveLoading(false); } }}
              className="text-xs font-medium bg-primary-light text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {approveLoading ? "…" : "Approve"}
            </button>
            <button
              disabled={approveLoading || rejectLoading}
              onClick={async () => { setRejectLoading(true); try { await onReject(appt._id); } finally { setRejectLoading(false); } }}
              className="text-xs font-medium text-danger hover:bg-tag-red px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {rejectLoading ? "…" : "Reject"}
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export default function DashboardView() {
  const { user } = useAuth();
  const { stats, activity, pending, todayAppts } = useDashboardStats();
  const approveAppt = useMutation(api.appointments.approveAppointment);
  const rejectAppt  = useMutation(api.appointments.rejectAppointment);

  const [showToday,   setShowToday]   = useState(false);
  const [showPending, setShowPending] = useState(false);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const firstName = user?.displayName?.split(" ")[0] ?? user?.displayName;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Good {greeting}, {firstName}.
        </h1>
        <p className="text-sm text-text-muted mt-1">Here's what's happening at the studio today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="calendar"
          label="Today's Appointments"
          value={stats?.todayAppointments}
          onClick={() => setShowToday((v) => !v)}
          active={showToday}
        />
        <StatCard
          icon="schedule"
          label="Pending Approvals"
          value={stats?.pendingApprovals}
          onClick={() => setShowPending((v) => !v)}
          active={showPending}
        />
        <StatCard icon="clients" label="Today's Clients" value={stats?.todayClients} />
      </div>

      {/* Today expandable */}
      {showToday && (
        <section className="mb-8">
          <h2 className="text-subtitle text-text-primary flex items-center gap-2">
            <Icon name="calendar" className="w-5 h-5 text-text-muted" />
            Today's Appointments
          </h2>
          <ApptTable rows={todayAppts} emptyText="No appointments today.">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Status</th>
          </ApptTable>
        </section>
      )}

      {/* Pending expandable */}
      {showPending && (
        <section className="mb-8">
          <h2 className="text-subtitle text-text-primary flex items-center gap-2">
            <Icon name="schedule" className="w-5 h-5 text-text-muted" />
            Pending Approvals
          </h2>
          {pending === undefined ? (
            <div className="space-y-2 mt-3">
              {[0,1,2].map((i) => <div key={i} className="h-10 bg-background-sidebar rounded-xl animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-text-muted mt-3">No pending appointments.</p>
          ) : (
            <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background-sidebar">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Client</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Pet</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Date / Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Service</th>
                    {user?.isAdmin && <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-widest">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((a) => (
                    <PendingRow
                      key={a._id}
                      appt={a}
                      isAdmin={user?.isAdmin}
                      onApprove={(id) => approveAppt({ appointmentId: id })}
                      onReject={(id) => rejectAppt({ appointmentId: id })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Status</th>
                  {user?.isAdmin && <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-widest">Price</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activity.map((appt) => {
                  const status = appt.status ?? "completed";
                  return (
                    <tr key={appt._id} className="hover:bg-ui-hover transition-colors">
                      <td className="px-5 py-3 font-medium text-text-primary whitespace-nowrap">{appt.clientName}</td>
                      <td className="px-5 py-3 text-text-secondary">
                        {appt.petName
                          ? <>{appt.petName}{appt.petBreed && <span className="text-text-muted text-xs ml-1">({appt.petBreed})</span>}</>
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3 text-text-secondary">{appt.groomer ?? <span className="text-text-muted">—</span>}</td>
                      <td className="px-5 py-3 text-text-muted whitespace-nowrap">{appt.date ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[status] ?? STATUS_BADGE.completed}`}>
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>
                      {user?.isAdmin && (
                        <td className="px-5 py-3 text-right font-medium text-text-primary">
                          {appt.price != null ? `$${appt.price.toFixed(2)}` : <span className="text-text-muted">—</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
