import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";
import { TEMPERAMENTS } from "../constants/pets";

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 bg-background-card";
const INPUT_OK  = `${INPUT} border-border focus:ring-primary`;
const INPUT_ERR = `${INPUT} border-danger focus:ring-danger`;

function fieldCls(err) { return err ? INPUT_ERR : INPUT_OK; }

export default function PetFormModal({ clientId, pet, onClose }) {
  const addPet    = useMutation(api.pets.addPet);
  const updatePet = useMutation(api.pets.updatePet);

  const isEdit = !!pet;

  const [name,        setName]        = useState(pet?.name        ?? "");
  const [breed,       setBreed]       = useState(pet?.breed       ?? "");
  const [species,     setSpecies]     = useState(pet?.species     ?? "dog");
  const [gender,      setGender]      = useState(pet?.gender      ?? "");
  const [birthdate,   setBirthdate]   = useState(pet?.birthdate   ?? "");
  const [weight,      setWeight]      = useState(pet?.weight != null ? String(pet.weight) : "");
  const [temperament,         setTemperament]         = useState(pet?.temperament ?? "");
  const [status,              setStatus]              = useState(pet?.status ?? "");
  const [medicalConditions,   setMedicalConditions]   = useState(pet?.medical_conditions?.join(", ") ?? "");
  const [allergies,           setAllergies]           = useState(pet?.allergies?.join(", ") ?? "");
  const [notes,       setNotes]       = useState(pet?.notes       ?? "");
  const [isActive,       setIsActive]       = useState(pet?.is_active       ?? true);
  const [isBlacklisted,  setIsBlacklisted]  = useState(pet?.is_blacklisted  ?? false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError,   setSaveError]   = useState("");
  const [loading,     setLoading]     = useState(false);

  function clearErr(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function parseAllergies(raw) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  function validate() {
    const errors = {};
    if (!name.trim())     errors.name      = "Pet name is required.";
    if (!breed.trim())    errors.breed     = "Breed is required.";
    if (!species)         errors.species   = "Species is required.";
    if (!gender)          errors.gender    = "Gender is required.";
    if (!birthdate)       errors.birthdate = "Birthday is required.";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);

    const payload = {
      name:         name.trim(),
      breed:        breed.trim(),
      species,
      gender,
      birthdate,
      weight:       weight ? parseFloat(weight) : undefined,
      temperament:         temperament || undefined,
      status:              status || undefined,
      medical_conditions:  parseAllergies(medicalConditions).length ? parseAllergies(medicalConditions) : undefined,
      allergies:           parseAllergies(allergies).length ? parseAllergies(allergies) : undefined,
      notes:        notes.trim() || undefined,
      is_active:      isActive,
      is_blacklisted: isBlacklisted,
    };

    try {
      if (isEdit) {
        await updatePet({ ...payload, petId: pet._id });
      } else {
        await addPet({ ...payload, clientId });
      }
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to save pet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">
            {isEdit ? "Edit Pet" : "Add Pet"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name + Breed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Pet Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); clearErr("name"); }}
                placeholder="e.g. Max"
                className={fieldCls(fieldErrors.name)}
              />
              {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Breed <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => { setBreed(e.target.value); clearErr("breed"); }}
                placeholder="e.g. Shih Tzu"
                className={fieldCls(fieldErrors.breed)}
              />
              {fieldErrors.breed && <p className="text-xs text-danger mt-1">{fieldErrors.breed}</p>}
            </div>
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Species <span className="text-danger">*</span>
            </label>
            <select
              value={species}
              onChange={(e) => { setSpecies(e.target.value); clearErr("species"); }}
              className={fieldCls(fieldErrors.species)}
            >
              <option value="">— Select species —</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="rabbit">Rabbit</option>
              <option value="guinea pig">Guinea Pig</option>
              <option value="hamster">Hamster</option>
              <option value="bird">Bird</option>
              <option value="ferret">Ferret</option>
              <option value="reptile">Reptile</option>
              <option value="other">Other</option>
            </select>
            {fieldErrors.species && <p className="text-xs text-danger mt-1">{fieldErrors.species}</p>}
          </div>

          {/* Gender + Birthdate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Gender <span className="text-danger">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => { setGender(e.target.value); clearErr("gender"); }}
                className={fieldCls(fieldErrors.gender)}
              >
                <option value="">— Select gender —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {fieldErrors.gender && <p className="text-xs text-danger mt-1">{fieldErrors.gender}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Birthday <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => { setBirthdate(e.target.value); clearErr("birthdate"); }}
                className={fieldCls(fieldErrors.birthdate)}
              />
              {fieldErrors.birthdate && <p className="text-xs text-danger mt-1">{fieldErrors.birthdate}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={INPUT_OK}
            >
              <option value="">— Select status —</option>
              <option value="intact">Intact</option>
              <option value="spayed">Spayed</option>
              <option value="neutered">Neutered</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Weight (lbs)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 12.5"
              className={INPUT_OK}
            />
          </div>

          {/* Temperament */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Temperament</label>
            <div className="flex flex-wrap gap-2">
              {TEMPERAMENTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemperament(temperament === t ? "" : t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize border transition-colors ${
                    temperament === t
                      ? "bg-primary text-white border-primary"
                      : "border-border text-text-secondary hover:bg-ui-hover"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Medical Conditions */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Medical Conditions
              <span className="ml-1 text-xs text-text-muted font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              placeholder="e.g. diabetes, arthritis, heart condition"
              className={INPUT_OK}
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Allergies
              <span className="ml-1 text-xs text-text-muted font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. shampoo, soap"
              className={INPUT_OK}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Grooming preferences, behaviour notes…"
              className={`${INPUT_OK} resize-none`}
            />
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-text-secondary">Active</span>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-primary" : "bg-border"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          )}

          {/* Blacklist toggle */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
            isBlacklisted ? "bg-tag-red border-danger/30" : "bg-background-sidebar border-border"
          }`}>
            <div>
              <p className="text-sm font-medium text-text-primary">Blacklisted</p>
              <p className="text-xs text-text-muted mt-0.5">Shows a warning when booking this pet</p>
            </div>
            <button
              type="button"
              onClick={() => setIsBlacklisted((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isBlacklisted ? "bg-danger" : "bg-border"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isBlacklisted ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
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
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
