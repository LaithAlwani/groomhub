import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

const FIELD_CLASSES = {
  base:  "w-full border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 bg-background-card",
  ok:    "border-border focus:ring-primary",
  error: "border-danger focus:ring-danger",
};

function fieldCls(hasError) {
  return `${FIELD_CLASSES.base} ${hasError ? FIELD_CLASSES.error : FIELD_CLASSES.ok}`;
}

export default function AppointmentFormModal({ contactId, appointment, pets = [], onClose }) {
  const { user } = useAuth();
  const addAppointment    = useMutation(api.appointments.addAppointment);
  const updateAppointment = useMutation(api.appointments.updateAppointment);

  const isEdit = !!appointment;
  const users  = useQuery(api.users.listGroomers, { sessionToken: user.sessionToken });

  const [petId,    setPetId]    = useState(appointment?.pet_id    ?? "");
  const [date,     setDate]     = useState(appointment?.date      ?? new Date().toISOString().slice(0, 10));
  const [noteText, setNoteText] = useState(appointment?.note_text ?? "");
  const [groomer,  setGroomer]  = useState(appointment?.groomer   ?? "");
  const [price,    setPrice]    = useState(appointment?.price != null ? String(appointment.price) : "");
  const [loading,  setLoading]  = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function clearFieldError(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const errors = {};
    if (pets.length > 0 && !petId) errors.petId    = "Please select a pet.";
    if (!date.trim())               errors.date     = "Date is required.";
    if (!groomer.trim())            errors.groomer  = "Please select a groomer.";
    if (!noteText.trim())           errors.noteText = "Notes are required.";
    if (!price.trim())              errors.price    = "Price is required.";
    else if (isNaN(parseFloat(price)) || parseFloat(price) < 0)
                                    errors.price    = "Enter a valid price.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const parsedPrice   = parseFloat(price);
    const resolvedPetId = petId || undefined;
    try {
      if (isEdit) {
        await updateAppointment({
          sessionToken:  user.sessionToken,
          appointmentId: appointment._id,
          petId:         resolvedPetId,
          date:          date.trim(),
          note_text:     noteText.trim(),
          groomer:       groomer.trim(),
          price:         parsedPrice,
        });
      } else {
        await addAppointment({
          sessionToken: user.sessionToken,
          contactId,
          petId:        resolvedPetId,
          date:         date.trim(),
          note_text:    noteText.trim(),
          groomer:      groomer.trim(),
          price:        parsedPrice,
        });
      }
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to save appointment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">
            {isEdit ? "Edit Appointment" : "Add Appointment"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Pet selector */}
          {pets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Pet <span className="text-danger">*</span>
              </label>
              <select
                value={petId}
                onChange={(e) => { setPetId(e.target.value); clearFieldError("petId"); }}
                className={fieldCls(!!fieldErrors.petId)}
              >
                <option value="">— Select a pet —</option>
                {pets.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || "Unnamed"}{p.breed ? ` (${p.breed})` : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.petId && (
                <p className="text-xs text-danger mt-1">{fieldErrors.petId}</p>
              )}
            </div>
          )}

          {/* Date + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); clearFieldError("date"); }}
                className={fieldCls(!!fieldErrors.date)}
              />
              {fieldErrors.date && (
                <p className="text-xs text-danger mt-1">{fieldErrors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Price ($) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => { setPrice(e.target.value); clearFieldError("price"); }}
                placeholder="e.g. 75"
                className={fieldCls(!!fieldErrors.price)}
              />
              {fieldErrors.price && (
                <p className="text-xs text-danger mt-1">{fieldErrors.price}</p>
              )}
            </div>
          </div>

          {/* Groomer */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Groomer <span className="text-danger">*</span>
            </label>
            <select
              value={groomer}
              onChange={(e) => { setGroomer(e.target.value); clearFieldError("groomer"); }}
              className={fieldCls(!!fieldErrors.groomer)}
            >
              <option value="">— Select a groomer —</option>
              {(users ?? []).map((u) => (
                <option key={u._id} value={u.displayName}>
                  {u.displayName}
                </option>
              ))}
            </select>
            {fieldErrors.groomer && (
              <p className="text-xs text-danger mt-1">{fieldErrors.groomer}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Notes <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => { setNoteText(e.target.value); clearFieldError("noteText"); }}
              placeholder="Describe the grooming session…"
              className={`${fieldCls(!!fieldErrors.noteText)} resize-none`}
            />
            {fieldErrors.noteText && (
              <p className="text-xs text-danger mt-1">{fieldErrors.noteText}</p>
            )}
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
              <Icon name="alert" className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm font-medium hover:bg-ui-hover transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-2 text-sm font-medium transition-colors">
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
