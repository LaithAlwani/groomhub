import { SCHEDULE_HOURS } from "../constants/appointments";

// Granularity of the schedule grid. Update this single constant to retune
// drag-drop snapping, slot click times, and overlap math.
export const SLOT_MINUTES   = 15;
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
export const SLOT_HEIGHT    = 32;
export const SLOT_COUNT     = (SCHEDULE_HOURS.end - SCHEDULE_HOURS.start) * SLOTS_PER_HOUR;

export function timeToSlot(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return (h - SCHEDULE_HOURS.start) * SLOTS_PER_HOUR + Math.floor(m / SLOT_MINUTES);
}

// Round a "HH:MM" string to the nearest slot boundary. Empty/invalid input passes through.
export function snapTimeToSlot(time) {
  if (!time) return time;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const snapped = Math.round(m / SLOT_MINUTES) * SLOT_MINUTES;
  const hh = snapped === 60 ? (h + 1) % 24 : h;
  const mm = snapped === 60 ? 0 : snapped;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export const BLOCK_COLOR = {
  pending:    "bg-warning/10 border-warning/40 text-warning",
  confirmed:  "bg-primary-light border-primary/30 text-primary",
  checked_in: "bg-primary-light border-primary/30 text-primary",
  completed:  "bg-success-light border-success/30 text-success-text",
  cancelled:  "bg-background-sidebar border-border text-text-muted line-through",
  no_show:    "bg-background-sidebar border-border text-text-muted line-through",
};
