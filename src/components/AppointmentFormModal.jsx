import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";
import { GROOMING_SERVICES, DURATIONS, STATUS_LABEL, STATUS_BADGE, SCHEDULE_HOURS } from "../constants/appointments";
import { useAuth } from "../context/AuthContext";
import { useAppointmentForm } from "../hooks/useAppointmentForm";
import { isPhoneQuery } from "../utils/phone";
import { matchesUser } from "../utils/userMatch";
import { todayLocalDate, currentLocalMinutes, timeStringToMinutes } from "../utils/time";
import { SLOT_MINUTES } from "./DayGrid";

import BlacklistWarningDialog from "./BlacklistWarningDialog";
import ConflictDialog from "./ConflictDialog";

const BASE = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 bg-background-card";
function fieldCls(hasError) {
  return `${BASE} ${hasError ? "border-danger focus:ring-danger" : "border-border focus:ring-primary"}`;
}

// Pre-built list of valid booking times based on schedule hours + slot granularity.
// Computed once at module load — bounded by SCHEDULE_HOURS so it stays small.
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = SCHEDULE_HOURS.start; h < SCHEDULE_HOURS.end; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const value  = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h < 12 ? "AM" : "PM";
      const hh12   = h % 12 || 12;
      opts.push({ value, label: `${hh12}:${String(m).padStart(2, "0")} ${period}` });
    }
  }
  return opts;
})();

function ClientSearchPicker({ onSelect, error }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(t);
  }, [search]);

  const trimmed   = search.trim();
  const phoneMode = isPhoneQuery(debouncedSearch);
  const nameResults = useQuery(
    api.clients.searchByName,
    debouncedSearch.length >= 1 && !phoneMode ? { query: debouncedSearch } : "skip",
  );
  const phoneResults = useQuery(
    api.clients.searchByPhone,
    debouncedSearch.length >= 1 && phoneMode ? { query: debouncedSearch } : "skip",
  );
  const results      = phoneMode ? phoneResults : nameResults;
  const showDropdown = trimmed.length > 0;
  // While the user is still typing or the query hasn't returned yet, show skeletons.
  const isLoading    = showDropdown && (trimmed !== debouncedSearch || results === undefined);

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        Client <span className="text-danger">*</span>
      </label>
      <div className="relative">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone number…"
          className={fieldCls(!!error)}
        />
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-20 mt-2 border border-border rounded-xl max-h-48 overflow-y-auto bg-background-card shadow-soft">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 bg-background-sidebar rounded-lg animate-pulse" />
                ))}
              </div>
            ) : results?.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No clients found</p>
            ) : (
              (results ?? []).map((client) => (
                <button
                  key={client._id}
                  type="button"
                  onClick={() => onSelect(client)}
                  className="w-full text-left px-3 py-2 hover:bg-ui-hover transition-colors border-b border-border last:border-b-0"
                >
                  <p className="text-sm font-medium text-text-primary capitalize">{client.client_name}</p>
                  {client.phones?.[0] && (
                    <p className="text-xs text-text-muted">{client.phones[0].number}</p>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function SelectedClient({ contactId, onChange, locked }) {
  const client = useQuery(api.clients.getClient, { id: contactId });

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">Client</label>
      <div className="flex items-center justify-between border border-border rounded-xl px-3 py-2 bg-background-sidebar">
        <div className="min-w-0">
          {client === undefined ? (
            <span className="text-sm text-text-muted">Loading…</span>
          ) : client === null ? (
            <span className="text-sm text-danger">Client not found</span>
          ) : (
            <>
              <p className="text-sm font-medium text-text-primary capitalize truncate">{client.client_name}</p>
              {client.phones?.[0] && (
                <p className="text-xs text-text-muted truncate">{client.phones[0].number}</p>
              )}
            </>
          )}
        </div>
        {!locked && (
          <button
            type="button"
            onClick={onChange}
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors shrink-0 ml-3"
          >
            Change
          </button>
        )}
      </div>
    </div>
  );
}

export default function AppointmentFormModal({
  contactId,
  appointment,
  onClose,
  prefillDate,
  prefillTime,
  prefillGroomerId,
}) {
  const { user } = useAuth();
  const [blacklistWarning, setBlacklistWarning] = useState(null);

  const form = useAppointmentForm({
    appointment, contactId, onClose,
    prefillDate, prefillTime, prefillGroomerId,
  });

  const apptStatus = appointment?.status ?? null;
  const isNewBooking = !appointment;
  const today        = todayLocalDate();

  // Existing appointments for the selected date; used to hide conflict slots.
  // Server already filters by canSee for non-admins, so a non-admin only sees
  // their own conflicts (which is exactly what they need since they can only
  // book for themselves).
  const dateAppointments = useQuery(
    api.appointments.getScheduleAppointments,
    form.date ? { date: form.date } : "skip",
  );

  // Build the bookable time list by composing two filters:
  //   1. past-time filter — applies whenever the chosen date is today, for both
  //      new bookings AND edits. The appointment's existing time is exempted so
  //      that simply editing notes/price on an in-progress appointment doesn't
  //      clobber its time field via the visibleTimeOptions cleanup effect.
  //   2. conflict filter — drop start times whose [start, start+duration) range
  //      overlaps any active appointment for the selected groomer on this date.
  const visibleTimeOptions = useMemo(() => {
    let opts = TIME_OPTIONS;

    if (form.date === today) {
      // Cutoff is the START of the NEXT slot after now. At 1:06 → 1:15,
      // at 1:15 exactly → 1:30, at 1:30 exactly → 1:45. The slot the user
      // is currently sitting in is treated as already-gone for booking.
      const nowMins      = currentLocalMinutes();
      const earliestMins = Math.floor(nowMins / SLOT_MINUTES) * SLOT_MINUTES + SLOT_MINUTES;
      const keepTime     = appointment?.time ?? null;
      opts = opts.filter((opt) => {
        if (opt.value === keepTime) return true;
        const m = timeStringToMinutes(opt.value);
        return m !== null && m >= earliestMins;
      });
    }

    if (form.groomerId && dateAppointments !== undefined) {
      const conflicting = dateAppointments.filter((a) =>
        a.groomerId === form.groomerId
        && a._id !== appointment?._id
        && a.status !== "cancelled"
        && a.status !== "completed"
        && a.status !== "no_show"
        && a.time
      );
      const newDuration = form.duration ? parseInt(form.duration) : 60;
      opts = opts.filter((opt) => {
        const start = timeStringToMinutes(opt.value);
        if (start === null) return false;
        const end = start + newDuration;
        return !conflicting.some((a) => {
          const aStart = timeStringToMinutes(a.time);
          if (aStart === null) return false;
          const aEnd = aStart + (a.duration ?? 60);
          return start < aEnd && aStart < end;
        });
      });
    }

    return opts;
  }, [form.date, today, form.groomerId, form.duration, dateAppointments, appointment?._id, appointment?.time]);

  // If the selected time falls outside the visible (future-only) options
  // — e.g. the user switched the date to today after the prefill became past —
  // clear it so the dropdown and the form state stay in sync.
  useEffect(() => {
    if (!form.time) return;
    if (!visibleTimeOptions.some((opt) => opt.value === form.time)) {
      form.setTime("");
    }
  }, [visibleTimeOptions, form.time]);

  return (
    <>
      {blacklistWarning && (
        <BlacklistWarningDialog
          pet={blacklistWarning}
          onCancel={() => setBlacklistWarning(null)}
          onConfirm={() => { form.setPetId(blacklistWarning._id); form.clearErr("petId"); setBlacklistWarning(null); }}
        />
      )}

      {form.conflict && (
        <ConflictDialog conflict={form.conflict} onClose={form.dismissConflict} />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md max-h-[92vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-subtitle text-text-primary">
                {form.isEdit ? "Edit Appointment" : "New Appointment"}
              </h2>
              {apptStatus && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[apptStatus] ?? STATUS_BADGE.pending}`}>
                  {STATUS_LABEL[apptStatus] ?? apptStatus}
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit} className="space-y-4">

            {/* Client */}
            {form.contactId ? (
              <SelectedClient
                contactId={form.contactId}
                onChange={form.clearClient}
                locked={form.isContactLocked}
              />
            ) : (
              <ClientSearchPicker
                onSelect={form.selectClient}
                error={form.fieldErrors.contact}
              />
            )}

            {/* Pet — only after a client is chosen */}
            {form.contactId && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Pet {form.activePets.length > 0 && <span className="text-danger">*</span>}
                </label>
                {form.petsLoading ? (
                  <div className="h-10 bg-background-sidebar rounded-xl animate-pulse" />
                ) : form.activePets.length === 0 ? (
                  <p className="text-sm text-text-muted px-3 py-2 border border-border rounded-xl">
                    This client has no active pets.
                  </p>
                ) : (
                  <select
                    value={form.petId}
                    onChange={(e) => {
                      const selected = form.activePets.find((p) => p._id === e.target.value);
                      if (selected?.is_blacklisted) { setBlacklistWarning(selected); }
                      else { form.setPetId(e.target.value); form.clearErr("petId"); }
                    }}
                    className={fieldCls(!!form.fieldErrors.petId)}
                  >
                    <option value="">— Select a pet —</option>
                    {form.activePets.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name || "Unnamed"}{p.breed ? ` (${p.breed})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {form.fieldErrors.petId && <p className="text-xs text-danger mt-1">{form.fieldErrors.petId}</p>}
              </div>
            )}

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Service Type</label>
              <select
                value={form.serviceType}
                onChange={(e) => form.setServiceType(e.target.value)}
                className={fieldCls(false)}
              >
                <option value="">— Select a service —</option>
                {GROOMING_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  min={isNewBooking ? today : undefined}
                  value={form.date}
                  onChange={(e) => { form.setDate(e.target.value); form.clearErr("date"); }}
                  className={fieldCls(!!form.fieldErrors.date)}
                />
                {form.fieldErrors.date && <p className="text-xs text-danger mt-1">{form.fieldErrors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Time</label>
                <select
                  value={form.time}
                  onChange={(e) => form.setTime(e.target.value)}
                  className={fieldCls(false)}
                >
                  <option value="">— Any time —</option>
                  {visibleTimeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Duration</label>
                <select
                  value={form.duration}
                  onChange={(e) => form.setDuration(e.target.value)}
                  className={fieldCls(false)}
                >
                  <option value="">— Select —</option>
                  {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Price ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={(e) => { form.setPrice(e.target.value); form.clearErr("price"); }}
                  placeholder="e.g. 75"
                  className={fieldCls(!!form.fieldErrors.price)}
                />
                {form.fieldErrors.price && <p className="text-xs text-danger mt-1">{form.fieldErrors.price}</p>}
              </div>
            </div>

            {/* Groomer */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Groomer <span className="text-danger">*</span>
              </label>
              <select
                value={form.groomerId}
                onChange={(e) => form.selectGroomer(e.target.value)}
                disabled={!form.isAdmin}
                className={`${fieldCls(!!form.fieldErrors.groomer)} ${!form.isAdmin ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {form.isAdmin && <option value="">— Select a groomer —</option>}
                {(form.users ?? []).map((u) => (
                  <option key={u._id} value={u.tokenIdentifier}>{u.displayName}</option>
                ))}
              </select>
              {form.fieldErrors.groomer && <p className="text-xs text-danger mt-1">{form.fieldErrors.groomer}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <textarea
                rows={3}
                value={form.noteText}
                onChange={(e) => { form.setNoteText(e.target.value); form.clearErr("noteText"); }}
                placeholder="Describe the grooming session…"
                className={`${fieldCls(!!form.fieldErrors.noteText)} resize-none`}
              />
              {form.fieldErrors.noteText && <p className="text-xs text-danger mt-1">{form.fieldErrors.noteText}</p>}
            </div>

            {form.saveError && (
              <div className="flex items-center gap-2 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
                <Icon name="alert" className="w-4 h-4 shrink-0" />
                {form.saveError}
              </div>
            )}

            <div className="space-y-2 pt-1">
              {form.isEdit && (() => {
                const isOwnAppt = matchesUser(appointment?.createdById, user?.userId)
                  || matchesUser(appointment?.groomerId, user?.userId);
                const canAct = user?.isAdmin || isOwnAppt;
                if (!canAct) return null;

                if (apptStatus === "checked_in") {
                  return (
                    <button
                      type="button" disabled={form.loading}
                      onClick={form.handleComplete}
                      className="w-full bg-success-light hover:bg-success/20 disabled:opacity-60 text-success-text border border-success/30 rounded-xl py-2 text-sm font-medium transition-colors"
                    >
                      {form.loading ? "Saving…" : "Mark as Complete"}
                    </button>
                  );
                }
                if (apptStatus === "confirmed") {
                  return (
                    <div className="flex gap-2">
                      <button
                        type="button" disabled={form.loading}
                        onClick={form.handleCheckIn}
                        className="flex-1 bg-primary-light hover:bg-primary/20 disabled:opacity-60 text-primary border border-primary/30 rounded-xl py-2 text-sm font-medium transition-colors"
                      >
                        Check in
                      </button>
                      <button
                        type="button" disabled={form.loading}
                        onClick={form.handleNoShow}
                        className="flex-1 bg-background-sidebar hover:bg-ui-active disabled:opacity-60 text-text-secondary border border-border rounded-xl py-2 text-sm font-medium transition-colors"
                      >
                        No-show
                      </button>
                      <button
                        type="button" disabled={form.loading}
                        onClick={form.handleCancel}
                        className="flex-1 bg-tag-red hover:bg-danger/20 disabled:opacity-60 text-danger border border-danger/30 rounded-xl py-2 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                if (apptStatus === "pending") {
                  return (
                    <div className="flex gap-2">
                      <button
                        type="button" disabled={form.loading}
                        onClick={form.handleApprove}
                        className="flex-1 bg-success-light hover:bg-success/20 disabled:opacity-60 text-success-text border border-success/30 rounded-xl py-2 text-sm font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button" disabled={form.loading}
                        onClick={form.handleReject}
                        className="flex-1 bg-tag-red hover:bg-danger/20 disabled:opacity-60 text-danger border border-danger/30 rounded-xl py-2 text-sm font-medium transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button" disabled={form.loading}
                        onClick={form.handleCancel}
                        className="flex-1 bg-background-sidebar hover:bg-ui-active disabled:opacity-60 text-text-secondary border border-border rounded-xl py-2 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm font-medium hover:bg-ui-hover transition-colors">
                  Close
                </button>
                <button type="submit" disabled={form.loading}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-2 text-sm font-medium transition-colors">
                  {form.loading ? "Saving…" : form.isEdit ? "Save Changes" : "Book Appointment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
