import { useMemo } from "react";
import { useQuery } from "convex/react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../../convex/_generated/api";
import { useSchedule } from "../hooks/useSchedule";
import { SLOT_HEIGHT, SLOT_COUNT, SLOT_MINUTES, SLOTS_PER_HOUR, BLOCK_COLOR, timeToSlot } from "./DayGrid";
import { SCHEDULE_HOURS, STATUS_PILL } from "../constants/appointments";
import { blockClassesFor } from "../constants/groomerColors";
import { isPastDateTime } from "../utils/time";

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

function formatHeaderDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function TimeGutter() {
  return (
    <div className="w-16 shrink-0 border-r border-border bg-background-sidebar">
      {Array.from({ length: SLOT_COUNT }).map((_, i) => {
        const totalMins = SCHEDULE_HOURS.start * 60 + i * SLOT_MINUTES;
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return (
          <div key={i} className="flex items-start justify-end pr-2 pt-1" style={{ height: SLOT_HEIGHT }}>
            {m === 0 && (
              <span className="text-[10px] font-medium text-text-muted leading-none">
                {h % 12 || 12}{h < 12 ? "am" : "pm"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DroppableSlot({ id, slotIndex, isHour, isPast, onClick }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: isPast });
  return (
    <div
      ref={setNodeRef}
      onClick={isPast ? undefined : onClick}
      className={`absolute left-0 right-0 border-b transition-colors ${
        isPast
          ? "bg-background-sidebar cursor-not-allowed"
          : isOver
            ? "bg-primary/10 cursor-pointer"
            : "hover:bg-ui-hover cursor-pointer"
      } ${isHour ? "border-border" : "border-border/40"}`}
      style={{ top: slotIndex * SLOT_HEIGHT, height: SLOT_HEIGHT }}
    />
  );
}

function DraggableAppt({ appt, topPx, heightPx, leftPx, rightPx, colorCls, isDraggable, isFaded, onApptClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:       appt._id,
    data:     { appt },
    disabled: !isDraggable,
  });

  const status = appt.status ?? "completed";
  const pill   = STATUS_PILL[status] ?? STATUS_PILL.pending;

  return (
    <div
      ref={setNodeRef}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      onClick={() => !isDragging && onApptClick?.(appt)}
      className={`absolute rounded-xl border px-2 py-1 overflow-hidden ${colorCls} ${
        isFaded ? "opacity-70" : ""
      } ${
        isDraggable
          ? isDragging ? "opacity-50 shadow-soft cursor-grabbing" : "cursor-grab hover:opacity-90"
          : "cursor-pointer hover:opacity-90"
      }`}
      style={{
        top:         topPx,
        height:      heightPx,
        left:        leftPx,
        right:       rightPx,
        transform:   CSS.Transform.toString(transform),
        zIndex:      isDragging ? 999 : 1,
        touchAction: "none",
      }}
    >
      <span className={`absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white ${pill.bg}`}>
        {pill.label}
      </span>
      <p className="text-[11px] font-semibold truncate leading-tight pr-14">{appt.clientName}</p>
      {appt.petName      && <p className="text-[10px] truncate opacity-80">{appt.petName}</p>}
      {appt.service_type && <p className="text-[10px] truncate opacity-70">{appt.service_type}</p>}
    </div>
  );
}

function resolveOverlaps(appointments) {
  const items = appointments
    .map((a) => ({ appt: a, slot: timeToSlot(a.time) ?? -1, span: Math.max(1, Math.round((a.duration ?? 60) / SLOT_MINUTES)) }))
    .sort((a, b) => a.slot - b.slot);

  return items.map((item, i) => {
    const prev = items[i - 1];
    const overlaps = prev && prev.slot + prev.span > item.slot;
    return { ...item, col: overlaps ? 1 : 0, totalCols: overlaps ? 2 : 1 };
  }).map((item, i, arr) => {
    if (item.col === 0) {
      const next = arr[i + 1];
      if (next && item.slot + item.span > next.slot) return { ...item, totalCols: 2 };
    }
    return item;
  });
}

function DayColumnPanel({ dateStr, groomerFilter, groomerColors, onSlotClick, onApptClick }) {
  const { appointments: allAppts } = useSchedule(dateStr);
  const isToday = dateStr === TODAY;

  function blockColorFor(appt) {
    const status = appt.status ?? "completed";
    if (status === "cancelled" || status === "no_show") return BLOCK_COLOR.cancelled;
    return blockClassesFor(groomerColors?.get(appt.groomerId) ?? null, appt.groomerId ?? appt._id);
  }

  const appointments = allAppts === undefined ? undefined
    : groomerFilter === "all"            ? allAppts
    : groomerFilter === "__unassigned__" ? allAppts.filter((a) => !a.groomerId)
    : allAppts.filter((a) => a.groomerId === groomerFilter);

  const scheduled   = (appointments ?? []).filter((a) => a.time);
  const unscheduled = (appointments ?? []).filter((a) => !a.time);
  const resolved    = resolveOverlaps(scheduled);

  function handleSlotClick(slotIndex) {
    if (!onSlotClick) return;
    const totalMins = SCHEDULE_HOURS.start * 60 + slotIndex * SLOT_MINUTES;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    onSlotClick(dateStr, `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col border-l border-border first:border-l-0">
      <div className={`text-center text-xs font-semibold py-2 border-b border-border bg-background-sidebar ${
        isToday ? "text-primary" : "text-text-muted"
      }`}>
        {formatHeaderDate(dateStr)}
        {isToday && <span className="ml-1.5 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full">Today</span>}
      </div>

      {appointments === undefined ? (
        <div className="animate-pulse bg-background-sidebar" style={{ minHeight: SLOT_COUNT * SLOT_HEIGHT }} />
      ) : (
        <div className="relative" style={{ minHeight: SLOT_COUNT * SLOT_HEIGHT }}>
          {Array.from({ length: SLOT_COUNT }).map((_, i) => {
            const totalMins = SCHEDULE_HOURS.start * 60 + i * SLOT_MINUTES;
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            const slotTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            return (
              <DroppableSlot
                key={i}
                id={`${dateStr}::${i}`}
                slotIndex={i}
                isHour={i % SLOTS_PER_HOUR === 0}
                isPast={isPastDateTime(dateStr, slotTime)}
                onClick={() => handleSlotClick(i)}
              />
            );
          })}

          {resolved.map(({ appt, slot, span, col, totalCols }) => {
            if (slot < 0 || slot >= SLOT_COUNT) return null;
            const status     = appt.status ?? "completed";
            const colorCls   = blockColorFor(appt);
            const isDraggable = status === "pending" || status === "confirmed";
            const isFaded    = status === "completed";
            const leftPx     = totalCols > 1 ? (col === 0 ? 2 : "50%") : 2;
            const rightPx    = totalCols > 1 ? (col === 0 ? "50%" : 2) : 2;
            return (
              <DraggableAppt
                key={appt._id}
                appt={appt}
                topPx={slot * SLOT_HEIGHT + 2}
                heightPx={span * SLOT_HEIGHT - 4}
                leftPx={leftPx}
                rightPx={rightPx}
                colorCls={colorCls}
                isDraggable={isDraggable}
                isFaded={isFaded}
                onApptClick={onApptClick}
              />
            );
          })}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div className="border-t border-border px-1 py-1 space-y-1">
          {unscheduled.map((appt) => {
            const status   = appt.status ?? "completed";
            const colorCls = blockColorFor(appt);
            const pill     = STATUS_PILL[status] ?? STATUS_PILL.pending;
            return (
              <div
                key={appt._id}
                onClick={() => onApptClick?.(appt)}
                className={`relative rounded-lg border px-1.5 py-1 cursor-pointer hover:opacity-90 transition-opacity ${colorCls} ${
                  status === "completed" ? "opacity-70" : ""
                }`}
              >
                <span className={`absolute top-0.5 right-0.5 text-[8px] font-bold uppercase tracking-wide px-1 py-px rounded-full text-white ${pill.bg}`}>
                  {pill.label}
                </span>
                <p className="text-[10px] font-semibold truncate pr-12">{appt.clientName}</p>
                {appt.petName && <p className="text-[10px] opacity-70 truncate">{appt.petName}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MultiDayGrid({ dates, groomerFilter = "all", onSlotClick, onApptClick }) {
  const groomers = useQuery(api.users.listGroomers);
  const groomerColors = useMemo(() => {
    const map = new Map();
    (groomers ?? []).forEach((g) => map.set(g.tokenIdentifier, g.color ?? null));
    return map;
  }, [groomers]);

  return (
    <div className="bg-background-card border border-border rounded-2xl shadow-card overflow-hidden w-full">
      <div className="flex overflow-x-auto" style={{ minHeight: SLOT_COUNT * SLOT_HEIGHT + 40 }}>
        <TimeGutter />
        {dates.map((date) => (
          <DayColumnPanel
            key={date}
            dateStr={date}
            groomerFilter={groomerFilter}
            groomerColors={groomerColors}
            onSlotClick={onSlotClick}
            onApptClick={onApptClick}
          />
        ))}
      </div>
    </div>
  );
}
