import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";
import { TEMPERAMENTS } from "../constants/pets";

export default function PetFormModal({ clientId, pet, onClose }) {
  const { user } = useAuth();
  const addPet    = useMutation(api.pets.addPet);
  const updatePet = useMutation(api.pets.updatePet);

  const isEdit = !!pet;

  const [name,        setName]        = useState(pet?.name        ?? "");
  const [breed,       setBreed]       = useState(pet?.breed       ?? "");
  const [species,     setSpecies]     = useState(pet?.species     ?? "dog");
  const [gender,      setGender]      = useState(pet?.gender      ?? "");
  const [birthdate,   setBirthdate]   = useState(pet?.birthdate   ?? "");
  const [weight,      setWeight]      = useState(pet?.weight != null ? String(pet.weight) : "");
  const [temperament, setTemperament] = useState(pet?.temperament ?? "");
  const [allergies,   setAllergies]   = useState(pet?.allergies?.join(", ") ?? "");
  const [notes,       setNotes]       = useState(pet?.notes       ?? "");
  const [isActive,    setIsActive]    = useState(pet?.is_active   ?? true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  function parseAllergies(raw) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      sessionToken: user.sessionToken,
      name:         name.trim(),
      breed:        breed.trim() || "unknown",
      species:      species || undefined,
      gender:       gender.trim() || undefined,
      birthdate:    birthdate || undefined,
      weight:       weight ? parseFloat(weight) : undefined,
      temperament:  temperament || undefined,
      allergies:    parseAllergies(allergies).length ? parseAllergies(allergies) : undefined,
      notes:        notes.trim() || undefined,
      is_active:    isActive,
    };

    try {
      if (isEdit) {
        await updatePet({ ...payload, petId: pet._id });
      } else {
        await addPet({ ...payload, clientId });
      }
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to save pet");
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
                Pet Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Max"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Breed <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Shih Tzu"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
              />
            </div>
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Species</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-background-card focus:outline-none focus:ring-2 focus:ring-primary"
            >
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
          </div>

          {/* Gender + Birthdate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-background-card focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Unknown</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutered">Neutered</option>
                <option value="spayed">Spayed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Birthdate</label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-background-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
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
              placeholder="e.g. chicken, wheat"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
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
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card resize-none"
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

          {error && (
            <p className="text-sm text-danger bg-tag-red rounded-xl px-3 py-2">{error}</p>
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
