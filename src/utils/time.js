// Local-time helpers used to keep "now" comparisons consistent across the
// schedule (drag-drop) and the appointment form (date/time pickers).

export function todayLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentLocalMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function timeStringToMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// True if the given (date, time) combination has already passed in local time.
// Empty date is treated as "not past" (unscheduled). Empty time on today is also
// "not past" — only the time-of-day half is in the past, not the day itself.
export function isPastDateTime(date, time) {
  if (!date) return false;
  const today = todayLocalDate();
  if (date < today) return true;
  if (date > today) return false;
  const mins = timeStringToMinutes(time);
  if (mins === null) return false;
  return mins < currentLocalMinutes();
}
