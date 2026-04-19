import Icon from "../assets/Icon";

export default function StatCard({ icon, label, value, adminOnly, isAdmin, comingSoon }) {
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
