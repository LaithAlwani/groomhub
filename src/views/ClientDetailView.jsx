import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useClientDetail } from "../hooks/useClientDetail";
import { phoneIcon } from "../utils/phone";
import Icon from "../assets/Icon";
import PetCard from "../components/PetCard";
import AppointmentRow from "../components/AppointmentRow";
import EditClientModal from "../components/EditClientModal";
import PetFormModal from "../components/PetFormModal";
import AppointmentFormModal from "../components/AppointmentFormModal";
import VaccinationFormModal from "../components/VaccinationFormModal";

export default function ClientDetailView({ contactId, onBack }) {
  const { user } = useAuth();
  const {
    contact, pets, appointments, vaccinations, status, loadMore,
    tabs, visible, apptTab, setApptTab,
    confirmDeletePet, setConfirmDeletePet,
    confirmDeleteAppt, setConfirmDeleteAppt,
    handleDeletePet, handleDeleteAppt,
    confirmDeleteClient, setConfirmDeleteClient, handleDeleteClient,
    confirmDeleteVaccination, setConfirmDeleteVaccination, handleDeleteVaccination,
  } = useClientDetail(contactId);

  const [showEditClient,   setShowEditClient]   = useState(false);
  const [petModal,         setPetModal]         = useState(null);
  const [apptModal,        setApptModal]        = useState(null);
  const [vaccinationModal, setVaccinationModal] = useState(null);

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

  const initials = contact.client_name
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="max-w-5xl space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        <Icon name="chevron-left" className="w-4 h-4" />
        Back to Clients
      </button>

      {/* Client header */}
      <div className="bg-background-card border border-border rounded-2xl p-6 shadow-card">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-lg font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-xl font-bold text-text-primary leading-tight capitalize">{contact.client_name}</h1>
              {contact.is_blacklisted && (
                <span className="shrink-0 text-xs font-medium bg-tag-red text-tag-redText px-2.5 py-1 rounded-full">
                  Blacklisted
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {contact.phones?.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Icon name={phoneIcon(p.type)} className="w-3.5 h-3.5 text-text-muted shrink-0" />
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
              {(contact.address || contact.city || contact.province || contact.postal_code) && (
                <div className="flex items-center gap-1.5 text-sm text-text-secondary w-full">
                  <Icon name="map-pin" className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="capitalize">
                    {[contact.address, contact.city, contact.province].filter(Boolean).join(", ")}
                    {contact.postal_code && <span className="uppercase"> {contact.postal_code}</span>}
                  </span>
                </div>
              )}
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

      {/* Pets */}
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

      {/* Vaccinations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Icon name="shield" className="w-4 h-4 text-text-muted" />
            Vaccinations
            <span className="text-xs font-medium text-text-muted bg-background-sidebar px-2 py-0.5 rounded-full">
              {vaccinations?.length ?? 0}
            </span>
          </h2>
          {(pets?.length ?? 0) > 0 && (
            <button
              onClick={() => setVaccinationModal({ mode: "add" })}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Add
            </button>
          )}
        </div>

        {!vaccinations || vaccinations.length === 0 ? (
          <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
            <Icon name="shield" className="w-8 h-8 text-border mx-auto mb-2" />
            <p className="text-sm text-text-muted">No vaccination records yet.</p>
            {(pets?.length ?? 0) > 0 && (
              <button
                onClick={() => setVaccinationModal({ mode: "add" })}
                className="mt-3 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Add the first vaccination
              </button>
            )}
          </div>
        ) : (
          <div className="bg-background-card border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-background-sidebar border-b border-border text-xs font-medium text-text-muted uppercase tracking-widest">
              <div className="w-24 shrink-0">Pet</div>
              <div className="flex-1">Vaccine</div>
              <div className="w-24 shrink-0">Given</div>
              <div className="w-24 shrink-0">Next Due</div>
              <div className="flex-1 hidden md:block">Vet Clinic</div>
              <div className="w-16 shrink-0" />
            </div>
            <div className="divide-y divide-border">
              {vaccinations.map((vacc) => {
                const petName   = pets?.find((p) => p._id === vacc.pet_id)?.name ?? "—";
                const isOverdue = vacc.due_date && vacc.due_date < new Date().toISOString().slice(0, 10);
                return (
                  <div key={vacc._id} className="flex items-center gap-3 px-5 py-3 hover:bg-ui-hover transition-colors">
                    <div className="w-24 shrink-0 text-xs text-text-secondary capitalize">{petName}</div>
                    <div className="flex-1 text-sm font-medium text-text-primary">{vacc.vaccine_name}</div>
                    <div className="w-24 shrink-0 text-xs text-text-secondary">{vacc.administered_date}</div>
                    <div className={`w-24 shrink-0 text-xs font-medium ${isOverdue ? "text-warning" : "text-text-secondary"}`}>
                      {vacc.due_date ?? <span className="text-text-muted italic">—</span>}
                    </div>
                    <div className="flex-1 hidden md:block text-xs text-text-muted truncate">
                      {vacc.vet_clinic ?? "—"}
                    </div>
                    <div className="w-16 shrink-0 flex items-center justify-end gap-1">
                      {confirmDeleteVaccination === vacc._id ? (
                        <>
                          <button
                            onClick={() => handleDeleteVaccination(vacc._id)}
                            className="text-xs font-medium text-white bg-danger px-1.5 py-0.5 rounded-md"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteVaccination(null)}
                            className="text-xs text-text-muted px-1 py-0.5"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setVaccinationModal({ mode: "edit", vaccination: vacc })}
                            className="p-1 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors"
                          >
                            <Icon name="edit" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteVaccination(vacc._id)}
                            className="p-1 text-text-muted hover:text-danger hover:bg-tag-red rounded-lg transition-colors"
                          >
                            <Icon name="trash" className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Appointments */}
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

      {/* Delete client — super admin only */}
      {user?.isSuperAdmin && (
        <div className="flex justify-end pt-2">
          {confirmDeleteClient ? (
            <div className="flex items-center gap-3 bg-background-card border border-danger rounded-2xl px-4 py-3 shadow-card">
              <p className="text-sm text-text-primary">
                Permanently delete <span className="font-semibold capitalize">{contact.client_name}</span> and all their pets and appointments?
              </p>
              <button
                onClick={() => handleDeleteClient(onBack)}
                className="text-sm font-medium text-white bg-danger hover:bg-danger/90 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDeleteClient(false)}
                className="text-sm text-text-secondary hover:text-text-primary px-2 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteClient(true)}
              className="flex items-center gap-2 text-sm text-danger hover:bg-tag-red px-3 py-2 rounded-xl transition-colors"
            >
              <Icon name="trash" className="w-4 h-4" />
              Delete Client
            </button>
          )}
        </div>
      )}

      {showEditClient && <EditClientModal client={contact} onClose={() => setShowEditClient(false)} />}
      {petModal && <PetFormModal clientId={contactId} pet={petModal.pet ?? null} onClose={() => setPetModal(null)} />}
      {vaccinationModal && (
        <VaccinationFormModal
          pets={pets ?? []}
          contactId={contactId}
          vaccination={vaccinationModal.vaccination ?? null}
          onClose={() => setVaccinationModal(null)}
        />
      )}
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
