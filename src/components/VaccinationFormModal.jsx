import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";
import { VACCINES } from "../constants/pets";

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 bg-background-card";
const INPUT_OK  = `${INPUT} border-border focus:ring-primary`;
const INPUT_ERR = `${INPUT} border-danger focus:ring-danger`;

function fieldCls(err) { return err ? INPUT_ERR : INPUT_OK; }

export default function VaccinationFormModal({ pets, contactId, vaccination, onClose }) {
  const addVaccination    = useMutation(api.vaccinations.addVaccination);
  const updateVaccination = useMutation(api.vaccinations.updateVaccination);

  const isEdit = !!vaccination;

  const defaultPetId = vaccination?.pet_id ?? pets[0]?._id ?? "";
  const isOtherVaccine = vaccination && !VACCINES.find((v) => v.label === vaccination.vaccine_name && v.label !== "Other");

  const [petId,             setPetId]             = useState(defaultPetId);
  const [vaccineName,       setVaccineName]        = useState(
    isEdit ? (VACCINES.find((v) => v.label === vaccination.vaccine_name) ? vaccination.vaccine_name : "Other") : "",
  );
  const [customName,        setCustomName]         = useState(isOtherVaccine ? vaccination.vaccine_name : "");
  const [administeredDate,  setAdministeredDate]   = useState(vaccination?.administered_date ?? "");
  const [dueDate,           setDueDate]            = useState(vaccination?.due_date ?? "");
  const [vetClinic,         setVetClinic]          = useState(vaccination?.vet_clinic ?? "");
  const [vetPhone,          setVetPhone]           = useState(vaccination?.vet_phone ?? "");
  const [notes,             setNotes]              = useState(vaccination?.notes ?? "");
  const [loading,           setLoading]            = useState(false);
  const [fieldErrors,       setFieldErrors]        = useState({});
  const [saveError,         setSaveError]          = useState("");

  const selectedPet  = pets.find((p) => p._id === petId);
  const petSpecies   = selectedPet?.species ?? "";

  const filteredVaccines = VACCINES.filter(
    (v) => v.species.length === 0 || v.species.includes(petSpecies) || v.label === "Rabies",
  );

  function clearErr(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const errors = {};
    if (!petId)                              errors.petId    = "Please select a pet.";
    if (!vaccineName)                        errors.vaccine  = "Please select a vaccine.";
    if (vaccineName === "Other" && !customName.trim()) errors.customName = "Please enter the vaccine name.";
    if (!administeredDate)                   errors.date     = "Date administered is required.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);

    const resolvedName = vaccineName === "Other" ? customName.trim() : vaccineName;

    try {
      if (isEdit) {
        await updateVaccination({
          vaccinationId:     vaccination._id,
          vaccine_name:      resolvedName,
          administered_date: administeredDate,
          due_date:          dueDate || undefined,
          vet_clinic:        vetClinic || undefined,
          vet_phone:         vetPhone || undefined,
          notes:             notes || undefined,
        });
      } else {
        await addVaccination({
          petId,
          contactId,
          vaccine_name:      resolvedName,
          administered_date: administeredDate,
          due_date:          dueDate || undefined,
          vet_clinic:        vetClinic || undefined,
          vet_phone:         vetPhone || undefined,
          notes:             notes || undefined,
        });
      }
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">
            {isEdit ? "Edit Vaccination" : "Add Vaccination"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Pet */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Pet <span className="text-danger">*</span>
              </label>
              <select
                value={petId}
                onChange={(e) => { setPetId(e.target.value); setVaccineName(""); clearErr("petId"); }}
                className={fieldCls(fieldErrors.petId)}
              >
                <option value="">— Select pet —</option>
                {pets.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {fieldErrors.petId && <p className="text-xs text-danger mt-1">{fieldErrors.petId}</p>}
            </div>
          )}

          {/* Vaccine */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Vaccine <span className="text-danger">*</span>
            </label>
            <select
              value={vaccineName}
              onChange={(e) => { setVaccineName(e.target.value); clearErr("vaccine"); }}
              className={fieldCls(fieldErrors.vaccine)}
            >
              <option value="">— Select vaccine —</option>
              {filteredVaccines.map((v) => (
                <option key={v.label} value={v.label}>{v.label}</option>
              ))}
            </select>
            {fieldErrors.vaccine && <p className="text-xs text-danger mt-1">{fieldErrors.vaccine}</p>}
          </div>

          {/* Custom vaccine name */}
          {vaccineName === "Other" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Vaccine Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => { setCustomName(e.target.value); clearErr("customName"); }}
                placeholder="Enter vaccine name"
                className={fieldCls(fieldErrors.customName)}
              />
              {fieldErrors.customName && <p className="text-xs text-danger mt-1">{fieldErrors.customName}</p>}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Date Administered <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={administeredDate}
                onChange={(e) => { setAdministeredDate(e.target.value); clearErr("date"); }}
                className={fieldCls(fieldErrors.date)}
              />
              {fieldErrors.date && <p className="text-xs text-danger mt-1">{fieldErrors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Next Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={INPUT_OK}
              />
            </div>
          </div>

          {/* Vet info */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Vet Clinic</label>
            <input
              type="text"
              value={vetClinic}
              onChange={(e) => setVetClinic(e.target.value)}
              placeholder="e.g. City Animal Hospital"
              className={INPUT_OK}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Vet Phone</label>
            <input
              type="tel"
              value={vetPhone}
              onChange={(e) => setVetPhone(e.target.value)}
              placeholder="613-555-0100"
              className={INPUT_OK}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this vaccination"
              className={`${INPUT_OK} resize-none`}
            />
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
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Vaccination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
