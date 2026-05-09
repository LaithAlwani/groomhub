import Icon from "../assets/Icon";

function formatTimeRange(time, duration) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const startMins = h * 60 + m;
  const endMins   = startMins + (duration ?? 60);
  const fmt = (mins) => {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const period = hh < 12 ? "am" : "pm";
    const display = hh % 12 || 12;
    return `${display}:${String(mm).padStart(2, "0")}${period}`;
  };
  return `${fmt(startMins)} – ${fmt(endMins)}`;
}

export default function ConflictDialog({ conflict, onClose }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-tag-red flex items-center justify-center shrink-0">
            <Icon name="alert" className="w-5 h-5 text-danger" />
          </div>
          <h3 className="font-semibold text-text-primary">Scheduling conflict</h3>
        </div>
        <p className="text-sm text-text-secondary mb-2">
          {conflict.groomerName ? <><span className="font-semibold text-text-primary">{conflict.groomerName}</span> already has</> : "This groomer already has"} an appointment{conflict.clientName ? <> with <span className="font-semibold text-text-primary">{conflict.clientName}</span></> : ""} that overlaps this slot.
        </p>
        <p className="text-sm text-text-muted mb-5">
          Existing appointment: <span className="font-medium text-text-secondary">{formatTimeRange(conflict.time, conflict.duration)}</span>
          {conflict.date && <> on <span className="font-medium text-text-secondary">{conflict.date}</span></>}.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary-hover text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
