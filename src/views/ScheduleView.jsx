import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { DndContext, PointerSensor, useSensors, useSensor } from "@dnd-kit/core";
import { api } from "../../convex/_generated/api";
import { SCHEDULE_HOURS } from "../constants/appointments";
import { useAuth } from "../context/AuthContext";
import MultiDayGrid from "../components/MultiDayGrid";
import AppointmentFormModal from "../components/AppointmentFormModal";
import ConflictDialog from "../components/ConflictDialog";
import Icon from "../assets/Icon";

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function format3DayLabel(startStr) {
  const end = addDays(startStr, 2);
  const s = new Date(startStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${s} – ${e}`;
}

const VIEW_MODES = [
  { id: "day",  label: "Day"    },
  { id: "3day", label: "3 Days" },
  { id: "week", label: "Week"   },
];

export default function ScheduleView() {
  const { user } = useAuth();
  const isAdmin  = !!user?.isAdmin;

  const [selectedDate,  setSelectedDate]  = useState(localDateString);
  const [viewMode,      setViewMode]      = useState("day");
  const [groomerFilter, setGroomerFilter] = useState("all");
  const [apptModal,     setApptModal]     = useState(null);
  const [conflict,      setConflict]      = useState(null);

  const groomers = useQuery(api.users.listGroomers);
  const moveAppt = useMutation(api.appointments.moveAppointment);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const appt = active.data.current?.appt;
    if (!appt) return;
    const [newDate, slotStr] = String(over.id).split("::");
    const slotIndex = Number(slotStr);
    const totalMins = SCHEDULE_HOURS.start * 60 + slotIndex * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const newTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (appt.date === newDate && appt.time === newTime) return;
    moveAppt({ appointmentId: appt._id, date: newDate, time: newTime }).catch((err) => {
      if (err?.data?.kind === "groomer_conflict") setConflict(err.data);
      else console.error("Failed to move appointment:", err);
    });
  }

  function stepSize() {
    return viewMode === "week" ? 7 : viewMode === "3day" ? 3 : 1;
  }

  function requestNewAppt(prefillDate, prefillTime, prefillGroomerId = undefined) {
    setApptModal({
      mode:             "add",
      prefillDate:      prefillDate ?? selectedDate,
      prefillTime,
      prefillGroomerId,
    });
  }

  const weekStart = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - d.getDay());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const dates = viewMode === "week"
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : viewMode === "3day"
      ? [selectedDate, addDays(selectedDate, 1), addDays(selectedDate, 2)]
      : [selectedDate];

  function headerLabel() {
    if (viewMode === "day")  return formatDateLabel(selectedDate);
    if (viewMode === "3day") return format3DayLabel(selectedDate);
    return `Week of ${formatDateLabel(weekStart)}`;
  }

  return (
    <div className="w-full">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate((d) => addDays(d, -stepSize()))}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-ui-hover rounded-xl transition-colors"
            >
              <Icon name="chevron-left" className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-text-primary px-2 min-w-65 text-center">
              {headerLabel()}
            </h2>
            <button
              onClick={() => setSelectedDate((d) => addDays(d, stepSize()))}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-ui-hover rounded-xl transition-colors"
            >
              <Icon name="chevron-left" className="w-4 h-4 rotate-180" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(localDateString())}
            className="text-xs font-medium text-text-secondary border border-border hover:border-primary/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Today
          </button>

          {isAdmin ? (
            <select
              value={groomerFilter}
              onChange={(e) => setGroomerFilter(e.target.value)}
              className="text-xs border border-border bg-background-card text-text-primary rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Groomers</option>
              {(groomers ?? []).map((g) => (
                <option key={g.tokenIdentifier} value={g.tokenIdentifier}>{g.displayName}</option>
              ))}
              <option value="__unassigned__">Unassigned</option>
            </select>
          ) : (
            <span className="text-xs font-medium text-text-secondary border border-border bg-background-sidebar rounded-lg px-2.5 py-1.5">
              My schedule
            </span>
          )}

          <div className="flex items-center gap-1 bg-background-sidebar rounded-xl p-1 ml-auto">
            {VIEW_MODES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === id
                    ? "bg-background-card text-text-primary shadow-card"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => requestNewAppt(selectedDate)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {/* Calendar — always the same component, just different date count */}
        <MultiDayGrid
          dates={dates}
          groomerFilter={groomerFilter}
          onSlotClick={requestNewAppt}
          onApptClick={(appt) => setApptModal({ mode: "edit", appt, contactId: appt.contact_id })}
        />
      </DndContext>

      {apptModal && (
        <AppointmentFormModal
          contactId={apptModal.appt?.contact_id ?? null}
          appointment={apptModal.appt ?? null}
          prefillDate={apptModal.prefillDate}
          prefillTime={apptModal.prefillTime}
          prefillGroomerId={apptModal.prefillGroomerId}
          onClose={() => setApptModal(null)}
        />
      )}

      {conflict && (
        <ConflictDialog conflict={conflict} onClose={() => setConflict(null)} />
      )}
    </div>
  );
}
