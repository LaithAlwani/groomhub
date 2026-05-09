import { SCHEDULE_HOURS } from "../constants/appointments";

export const SLOT_HEIGHT = 56;
export const SLOT_COUNT  = (SCHEDULE_HOURS.end - SCHEDULE_HOURS.start) * 2;

export function timeToSlot(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return (h - SCHEDULE_HOURS.start) * 2 + Math.floor(m / 30);
}

export const BLOCK_COLOR = {
  pending:   "bg-warning/10 border-warning/40 text-warning",
  confirmed: "bg-primary-light border-primary/30 text-primary",
  completed: "bg-success-light border-success/30 text-success-text",
  cancelled: "bg-background-sidebar border-border text-text-muted line-through",
};
