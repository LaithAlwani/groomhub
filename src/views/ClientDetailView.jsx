import { useState } from "react";
import { useQuery, usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { calcAge } from "../utils/pet";
import Icon from "../assets/Icon";
import EditClientModal from "../components/EditClientModal";
import PetFormModal from "../components/PetFormModal";
import AppointmentFormModal from "../components/AppointmentFormModal";

// ── Temperament badge ─────────────────────────────────────────────────────────
const TEMPERAMENT_CLASSES = {
  friendly:    "bg-temperament-friendly text-temperament-friendlyText",
  calm:        "bg-temperament-calm text-temperament-calmText",
  energetic:   "bg-temperament-energetic text-temperament-energeticText",
  nervous:     "bg-temperament-nervous text-temperament-nervousText",
  aggressive:  "bg-temperament-aggressive text-temperament-aggressiveText",
  independent: "bg-temperament-independent text-temperament-independentText",
};

function TemperamentBadge({ value }) {
  const classes = TEMPERAMENT_CLASSES[value?.toLowerCase()] ?? "bg-border text-text-muted";
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${classes}`}>
      {value}
    </span>
  );
}

// ── Pet card ──────────────────────────────────────────────────────────────────
function PetCard({ pet, user, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const age = calcAge(pet.birthdate);

  return (
    <div className={`bg-background-card border border-border rounded-2xl shadow-card overflow-hidden flex flex-col ${
      pet.is_active === false ? "opacity-60" : ""
    }`}>
      {/* Card header */}
      <div className="bg-background-sidebar px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-light text-primary font-bold text-sm flex items-center justify-center shrink-0">
            {(pet.name || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary text-sm truncate leading-tight">
              {pet.name || <span className="italic text-text-muted">Unnamed</span>}
            </p>
            <p className="text-xs text-text-muted capitalize truncate mt-0.5">
              {[pet.species, pet.breed].filter(Boolean).join(" · ") || "Unknown breed"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit} className="p-1 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors">
            <Icon name="edit" className="w-3.5 h-3.5" />
          </button>
          {user?.isAdmin && (
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

      {/* Card body */}
      <div className="px-4 py-3 flex flex-col gap-2.5 flex-1">
        {/* Attributes grid */}
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
        </div>

        {/* Status */}
        {pet.is_active === false && (
          <span className="text-[10px] font-medium bg-border text-text-muted px-2 py-0.5 rounded-full w-fit">
            Inactive
          </span>
        )}

        {/* Allergies */}
        {pet.allergies?.length > 0 && (
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Allergies</p>
            <div className="flex flex-wrap gap-1">
              {pet.allergies.map((a) => (
                <span key={a} className="text-[10px] font-medium bg-tag-red text-tag-redText px-2 py-0.5 rounded-full">
                  ⚠ {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {pet.notes && (
          <p className="text-[10px] text-text-muted border-t border-border pt-2 mt-auto line-clamp-2 leading-relaxed">
            {pet.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Appointment row ───────────────────────────────────────────────────────────
function AppointmentRow({ appt, user, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-5 py-4 hover:bg-ui-hover transition-colors">
      <div className="flex items-start gap-4">
        {/* Date column */}
        <div className="w-24 shrink-0">
          {appt.date
            ? <>
              <p className="flex items-center gap-1 text-[10px] text-text-primary"><Icon name="calendar" className="w-3 h-3" />{appt.date}</p>
                
              </>
            : <p className="text-xs text-text-muted italic">History</p>
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {appt.groomer && (
              <span className="flex items-center gap-1 text-xs text-text-primary">
                <Icon name="scissors" className="w-3 h-3" />
                {appt.groomer}
              </span>
            )}
            {appt.price != null && (
              <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                ${appt.price.toFixed(2)}
              </span>
            )}
          </div>
          {appt.is_legacy ? (
            <div className="flex flex-col divide-y divide-border -mx-5 mt-1">
              {appt.note_text
                .split("\n")
                .filter((line) => line.trim())
                .map((line, i) => (
                  <p key={i} className="text-sm text-text-secondary leading-relaxed px-5 py-2">
                    {line}
                  </p>
                ))}
            </div>
          ) : (
            <>
              <p
                className={`text-sm text-text-secondary leading-relaxed cursor-pointer ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}
                onClick={() => setExpanded((v) => !v)}
              >
                {appt.note_text}
              </p>
              {appt.note_text?.length > 100 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs text-primary hover:text-primary-hover mt-0.5 transition-colors"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            {(user?.isAdmin || appt.createdById === user?.userId) && (
              <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors">
                <Icon name="edit" className="w-3.5 h-3.5" />
              </button>
            )}
            {user?.isAdmin && (
              confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button onClick={onConfirmDelete} className="text-xs font-medium text-white bg-danger px-2 py-1 rounded-lg">Confirm</button>
                  <button onClick={onCancelDelete} className="text-xs text-text-secondary px-2 py-1 rounded-lg hover:bg-ui-hover transition-colors">Cancel</button>
                </div>
              ) : (
                <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-danger hover:bg-tag-red rounded-lg transition-colors">
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
          {(appt.createdBy || appt.editedBy) && (
            <span className="text-[10px] text-text-muted">
              {appt.editedBy ? `edited by ${appt.editedBy}` : `created by ${appt.createdBy}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function ClientDetailView({ contactId, onBack }) {
  const { user } = useAuth();
  const contact = useQuery(api.clients.getClient, { id: contactId });
  const pets    = useQuery(api.pets.getPetsByContact, { contactId });
  const { results: appointments, status, loadMore } = usePaginatedQuery(
    api.appointments.getAppointmentsByContact,
    { contactId },
    { initialNumItems: 20 },
  );

  const deletePet         = useMutation(api.pets.deletePet);
  const deleteAppointment = useMutation(api.appointments.deleteAppointment);

  const [showEditClient,    setShowEditClient]    = useState(false);
  const [petModal,          setPetModal]          = useState(null);
  const [apptModal,         setApptModal]         = useState(null);
  const [confirmDeletePet,  setConfirmDeletePet]  = useState(null);
  const [confirmDeleteAppt, setConfirmDeleteAppt] = useState(null);
  const [apptTab,           setApptTab]           = useState("all");

  if (contact === undefined || pets === undefined) {
    return (
      <div className="space-y-4 animate-pulse max-w-5xl">
        <div className="h-32 bg-background-card border border-border rounded-2xl" />
        <div className="h-48 bg-background-card border border-border rounded-2xl" />
      </div>
    );
  }
  if (contact === null) {
    return <p className="text-danger text-sm">Client not found.</p>;
  }

  async function handleDeletePet(petId) {
    await deletePet({ sessionToken: user.sessionToken, petId });
    setConfirmDeletePet(null);
  }

  async function handleDeleteAppt(appointmentId) {
    await deleteAppointment({ sessionToken: user.sessionToken, appointmentId });
    setConfirmDeleteAppt(null);
  }

  const initials = contact.client_name
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // Build appointment tabs
  const hasLegacy = appointments?.some((a) => a.is_legacy) ?? false;
  const tabs = appointments ? [
    { id: "all",    label: "All",    count: appointments.length },
    ...(pets ?? [])
      .filter((p) => appointments.some((a) => a.pet_id === p._id))
      .map((p) => ({
        id: p._id, label: p.name || "Unnamed",
        count: appointments.filter((a) => a.pet_id === p._id).length,
      })),
    ...(hasLegacy ? [{ id: "legacy", label: "Legacy", count: appointments.filter((a) => a.is_legacy).length }] : []),
  ] : [];

  const visible = !appointments ? [] :
    apptTab === "all"    ? appointments :
    apptTab === "legacy" ? appointments.filter((a) => a.is_legacy) :
                           appointments.filter((a) => a.pet_id === apptTab);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <Icon name="chevron-left" className="w-4 h-4" />
        Back to Clients
      </button>

      {/* ── Client header ──────────────────────────────────────── */}
      <div className="bg-background-card border border-border rounded-2xl p-6 shadow-card">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-lg font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary leading-tight mb-3">{contact.client_name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {contact.phones?.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Icon name="phone-work" className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span>{p.number}</span>
                  {p.type && <span className="text-xs text-text-muted bg-background-sidebar px-1.5 py-0.5 rounded-md">{p.type}</span>}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-sm">
                <Icon name="mail" className="w-3.5 h-3.5 text-text-muted shrink-0" />
                {contact.email
                  ? <span className="text-text-secondary">{contact.email}</span>
                  : <span className="text-text-muted italic">No email on file</span>
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-2 bg-background-sidebar rounded-xl">
              <p className="text-lg font-bold text-text-primary">{pets?.length ?? 0}</p>
              <p className="text-xs text-text-muted">Pets</p>
            </div>
            <div className="text-center px-4 py-2 bg-background-sidebar rounded-xl">
              <p className="text-lg font-bold text-text-primary">{appointments?.length ?? 0}</p>
              <p className="text-xs text-text-muted">Visits</p>
            </div>
            <button onClick={() => setShowEditClient(true)} className="p-2 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-xl transition-colors" title="Edit client">
              <Icon name="edit" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Pets ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Icon name="paw" className="w-4 h-4 text-text-muted" />
            Pets
            <span className="text-xs font-medium text-text-muted bg-background-sidebar px-2 py-0.5 rounded-full">
              {pets?.length ?? 0}
            </span>
          </h2>
          <button
            onClick={() => setPetModal({ mode: "add" })}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Add Pet
          </button>
        </div>

        {pets?.length === 0 ? (
          <div className="bg-background-card border border-border rounded-2xl p-10 text-center">
            <Icon name="paw" className="w-8 h-8 text-border mx-auto mb-2" />
            <p className="text-sm text-text-muted">No pets on file yet.</p>
            <button onClick={() => setPetModal({ mode: "add" })} className="mt-3 text-sm text-primary hover:text-primary-hover font-medium transition-colors">
              Add the first pet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {pets.map((pet) => (
              <PetCard
                key={pet._id}
                pet={pet}
                user={user}
                onEdit={() => setPetModal({ mode: "edit", pet })}
                onDelete={() => setConfirmDeletePet(pet._id)}
                confirmDelete={confirmDeletePet === pet._id}
                onConfirmDelete={() => handleDeletePet(pet._id)}
                onCancelDelete={() => setConfirmDeletePet(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Appointments ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Icon name="scissors" className="w-4 h-4 text-text-muted" />
            Appointment History
            <span className="text-xs font-medium text-text-muted bg-background-sidebar px-2 py-0.5 rounded-full">
              {appointments?.length ?? 0}
            </span>
          </h2>
          <button
            onClick={() => setApptModal({ mode: "add" })}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setApptTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  apptTab === tab.id
                    ? "bg-primary-light text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-ui-hover"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  apptTab === tab.id ? "bg-primary text-white" : "bg-border text-text-muted"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {status === "LoadingFirstPage" ? (
          <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 border-b border-border last:border-0 animate-pulse">
                <div className="w-24 shrink-0">
                  <div className="h-3 bg-border rounded w-12 mb-1.5" />
                  <div className="h-2.5 bg-background-sidebar rounded w-8" />
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-border rounded w-48 mb-2" />
                  <div className="h-3 bg-background-sidebar rounded w-full mb-1" />
                  <div className="h-3 bg-background-sidebar rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-background-card border border-border rounded-2xl p-10 text-center">
            <Icon name="scissors" className="w-8 h-8 text-border mx-auto mb-2" />
            <p className="text-sm text-text-muted">No appointments yet.</p>
            <button onClick={() => setApptModal({ mode: "add" })} className="mt-3 text-sm text-primary hover:text-primary-hover font-medium transition-colors">
              Add the first appointment
            </button>
          </div>
        ) : (
          <div className="bg-background-card border border-border rounded-2xl overflow-hidden shadow-card">
            {/* Column headers */}
            <div className="flex items-center gap-4 px-5 py-2.5 bg-background-sidebar border-b border-border">
              <div className="w-24 shrink-0 text-xs font-medium text-text-muted uppercase tracking-widest">Date</div>
              <div className="flex-1 text-xs font-medium text-text-muted uppercase tracking-widest">Notes</div>
              <div className="w-16 shrink-0" />
            </div>

            <div className="divide-y divide-border">
              {visible.map((appt) => (
                <AppointmentRow
                  key={appt._id}
                  appt={appt}
                  user={user}
                  onEdit={() => setApptModal({ mode: "edit", appt })}
                  onDelete={() => setConfirmDeleteAppt(appt._id)}
                  confirmDelete={confirmDeleteAppt === appt._id}
                  onConfirmDelete={() => handleDeleteAppt(appt._id)}
                  onCancelDelete={() => setConfirmDeleteAppt(null)}
                />
              ))}
            </div>

            {status === "CanLoadMore" && apptTab === "all" && (
              <div className="border-t border-border">
                <button
                  onClick={() => loadMore(20)}
                  className="w-full py-3 text-sm text-primary hover:text-primary-hover font-medium hover:bg-ui-hover transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showEditClient && <EditClientModal client={contact} onClose={() => setShowEditClient(false)} />}
      {petModal && <PetFormModal clientId={contactId} pet={petModal.pet ?? null} onClose={() => setPetModal(null)} />}
      {apptModal && (
        <AppointmentFormModal
          contactId={contactId}
          appointment={apptModal.appt ?? null}
          pets={pets ?? []}
          onClose={() => setApptModal(null)}
        />
      )}
    </div>
  );
}
