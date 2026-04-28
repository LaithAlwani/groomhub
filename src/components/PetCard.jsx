import { calcAge } from "../utils/pet";
import Icon from "../assets/Icon";
import TemperamentBadge from "./TemperamentBadge";

export default function PetCard({ pet, user, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const age = calcAge(pet.birthdate);

  return (
    <div className={`bg-background-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col ${
      pet.is_active === false ? "opacity-60" : ""
    }`}>
      <div className="bg-background-sidebar px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-light text-primary font-bold text-sm flex items-center justify-center shrink-0">
            {(pet.name || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary text-sm truncate leading-tight">
                {pet.name || <span className="italic text-text-muted">Unnamed</span>}
              </p>
              {pet.is_blacklisted && (
                <span className="shrink-0 text-[10px] font-medium bg-tag-red text-tag-redText px-2 py-0.5 rounded-full">
                  Blacklisted
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted capitalize truncate mt-0.5">
              {[pet.species, pet.breed].filter(Boolean).join(" · ") || "Unknown breed"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit} className="p-1 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors">
            <Icon name="edit" className="w-3.5 h-3.5" />
          </button>
          {user?.isSuperAdmin && (
            confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={onConfirmDelete} className="text-xs font-medium text-white bg-danger px-1.5 py-0.5 rounded-md">Yes</button>
                <button onClick={onCancelDelete} className="text-xs text-text-muted px-1 py-0.5 rounded-md">✕</button>
              </div>
            ) : (
              <button onClick={onDelete} className="p-1 text-text-muted hover:text-danger hover:bg-tag-red rounded-lg transition-colors">
                <Icon name="trash" className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5 flex-1">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {pet.gender && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Gender</p>
              <p className="text-xs text-text-primary capitalize">{pet.gender}</p>
            </div>
          )}
          {age && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Age</p>
              <p className="text-xs text-text-primary">{age}</p>
            </div>
          )}
          {pet.weight != null && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Weight</p>
              <p className="text-xs text-text-primary">{pet.weight} lbs</p>
            </div>
          )}
          {pet.temperament && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Temperament</p>
              <TemperamentBadge value={pet.temperament} />
            </div>
          )}
          {pet.status && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Status</p>
              <p className="text-xs text-text-primary capitalize">{pet.status}</p>
            </div>
          )}
        </div>

        {pet.is_active === false && (
          <span className="text-[10px] font-medium bg-border text-text-muted px-2 py-1 rounded-full w-fit">
            Inactive
          </span>
        )}

        {pet.medical_conditions?.length > 0 && (
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Medical Conditions</p>
            <div className="flex flex-wrap gap-1">
              {pet.medical_conditions.map((c) => (
                <span key={c} className="text-[10px] font-medium bg-primary-light text-primary px-2 py-1 rounded-full capitalize">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {pet.allergies?.length > 0 && (
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Allergies</p>
            <div className="flex flex-wrap gap-1">
              {pet.allergies.map((allergy) => (
                <span key={allergy} className="text-[10px] font-medium bg-tag-red text-tag-redText px-2 py-1 rounded-full">
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}

        {pet.notes && (
          <p className="text-[10px] text-text-muted border-t border-border pt-2 mt-auto line-clamp-2 leading-relaxed">
            {pet.notes}
          </p>
        )}
      </div>
    </div>
  );
}
