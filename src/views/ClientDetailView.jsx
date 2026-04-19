import { useState } from "react";
import { useQuery, usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { calcAge } from "../utils/pet";
import Icon from "../assets/Icon";
import EditClientModal from "../components/EditClientModal";
import PetFormModal from "../components/PetFormModal";
import AppointmentFormModal from "../components/AppointmentFormModal";

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
    return <p className="text-text-secondary text-sm">Loading…</p>;
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

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <Icon name="chevron-left" className="w-4 h-4" />
        Back to Clients
      </button>

      {/* ── Client info ──────────────────────────────────────── */}
      <section className="mb-8">
        <div className="bg-background-card border border-border rounded-2xl p-5 shadow-card relative max-w-sm">
          <button
            onClick={() => setShowEditClient(true)}
            className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors"
            title="Edit client"
          >
            <Icon name="edit" className="w-4 h-4" />
          </button>

          <h1 className="text-title text-text-primary mb-4 pr-8">{contact.client_name}</h1>

          <div className="space-y-2 text-sm text-text-secondary">
            {contact.phones?.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon name="phone-work" className="w-4 h-4 text-text-muted shrink-0" />
                <span>{p.number}</span>
                {p.type && (
                  <span className="text-xs text-text-muted bg-background-sidebar px-1.5 py-0.5 rounded">
                    {p.type}
                  </span>
                )}
              </div>
            ))}
            {contact.email ? (
              <div className="flex items-center gap-2">
                <Icon name="mail" className="w-4 h-4 text-text-muted shrink-0" />
                <span>{contact.email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-text-muted">
                <Icon name="mail" className="w-4 h-4 shrink-0" />
                <span>No email on file</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Pets ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-subtitle text-text-primary flex items-center gap-2">
            <Icon name="paw" className="w-5 h-5 text-text-muted" />
            Pets ({pets?.length ?? 0})
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
          <p className="text-sm text-text-muted">No pets on file.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {pets.map((pet) => {
              const age = calcAge(pet.birthdate);
              return (
                <div key={pet._id} className="bg-background-card border border-border rounded-xl p-3 shadow-card">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">
                        {pet.name || <span className="italic text-text-muted">Unnamed</span>}
                      </p>
                      <p className="text-xs text-text-muted truncate capitalize">
                        {[pet.species, pet.breed].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => setPetModal({ mode: "edit", pet })}
                        className="p-1 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-md transition-colors">
                        <Icon name="edit" className="w-3.5 h-3.5" />
                      </button>
                      {user?.isAdmin && (
                        confirmDeletePet === pet._id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeletePet(pet._id)}
                              className="text-xs font-medium text-white bg-danger px-1.5 py-0.5 rounded-md">
                              Confirm
                            </button>
                            <button onClick={() => setConfirmDeletePet(null)}
                              className="text-xs text-text-muted hover:text-text-primary px-1 py-0.5 rounded-md">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeletePet(pet._id)}
                            className="p-1 text-text-muted hover:text-danger hover:bg-tag-red rounded-md transition-colors">
                            <Icon name="trash" className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {pet.gender && (
                      <span className="text-[10px] bg-background-sidebar text-text-secondary px-1.5 py-0.5 rounded capitalize">
                        {pet.gender}
                      </span>
                    )}
                    {age && (
                      <span className="text-[10px] bg-background-sidebar text-text-secondary px-1.5 py-0.5 rounded">
                        {age}
                      </span>
                    )}
                    {pet.weight != null && (
                      <span className="text-[10px] bg-background-sidebar text-text-secondary px-1.5 py-0.5 rounded">
                        {pet.weight} lbs
                      </span>
                    )}
                    {pet.temperament && (
                      <span className="text-[10px] bg-background-sidebar text-text-secondary px-1.5 py-0.5 rounded capitalize">
                        {pet.temperament}
                      </span>
                    )}
                    {pet.is_active === false && (
                      <span className="text-[10px] bg-border text-text-muted px-1.5 py-0.5 rounded">
                        inactive
                      </span>
                    )}
                  </div>

                  {/* Allergies */}
                  {pet.allergies?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pet.allergies.map((a) => (
                        <span key={a} className="text-[10px] bg-tag-red text-tag-redText px-1.5 py-0.5 rounded-full">
                          ⚠ {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {pet.notes && (
                    <p className="text-[10px] text-text-muted border-t border-border pt-1.5 mt-1.5 line-clamp-2">
                      {pet.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Appointments ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-subtitle text-text-primary flex items-center gap-2">
            <Icon name="scissors" className="w-5 h-5 text-text-muted" />
            Appointment History
          </h2>
          <button
            onClick={() => setApptModal({ mode: "add" })}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Add
          </button>
        </div>

        {status === "LoadingFirstPage" ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : (() => {
          const hasLegacy = appointments.some((a) => a.is_legacy);

          // Build tab list
          const tabs = [
            { id: "all", label: "All", count: appointments.length },
            ...(pets ?? [])
              .filter((p) => appointments.some((a) => a.pet_id === p._id))
              .map((p) => ({
                id:    p._id,
                label: p.name || "Unnamed",
                count: appointments.filter((a) => a.pet_id === p._id).length,
              })),
            ...(hasLegacy
              ? [{ id: "legacy", label: "Legacy", count: appointments.filter((a) => a.is_legacy).length }]
              : []),
          ];

          // Filter appointments for active tab
          const visible =
            apptTab === "all"    ? appointments :
            apptTab === "legacy" ? appointments.filter((a) => a.is_legacy) :
                                   appointments.filter((a) => a.pet_id === apptTab);

          return (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-4 flex-wrap">
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
                      apptTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-border text-text-muted"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Appointment list */}
              {visible.length === 0 ? (
                <p className="text-sm text-text-muted">No appointments in this tab.</p>
              ) : (
                <div className="space-y-3">
                  {visible.map((appt) => (
                    <div key={appt._id} className="border-l-2 border-border pl-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm flex-1 min-w-0">
                          {appt.date && <p className="text-xs text-text-muted mb-0.5">{appt.date}</p>}
                          {appt.groomer && <p className="text-xs text-text-muted mb-0.5">Groomer: {appt.groomer}</p>}
                          {appt.price != null && <p className="text-xs text-text-muted mb-0.5">Price: ${appt.price}</p>}
                          <p className="text-text-secondary whitespace-pre-wrap">{appt.note_text}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(user?.isAdmin || appt.createdById === user?.userId) && (
                            <button onClick={() => setApptModal({ mode: "edit", appt })}
                              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors">
                              <Icon name="edit" className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {user?.isAdmin && (
                            confirmDeleteAppt === appt._id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDeleteAppt(appt._id)}
                                  className="text-xs font-medium text-white bg-danger px-2 py-1 rounded-lg">
                                  Confirm
                                </button>
                                <button onClick={() => setConfirmDeleteAppt(null)}
                                  className="text-xs font-medium text-text-secondary px-2 py-1 rounded-lg hover:bg-ui-hover transition-colors">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteAppt(appt._id)}
                                className="p-1.5 text-text-muted hover:text-danger hover:bg-tag-red rounded-lg transition-colors">
                                <Icon name="trash" className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {status === "CanLoadMore" && apptTab === "all" && (
                    <button onClick={() => loadMore(20)}
                      className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
                      Load more
                    </button>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </section>

      {showEditClient && (
        <EditClientModal client={contact} onClose={() => setShowEditClient(false)} />
      )}
      {petModal && (
        <PetFormModal clientId={contactId} pet={petModal.pet ?? null} onClose={() => setPetModal(null)} />
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
