import { useQuery } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";

export default function ClientDetail({ contactId, onBack }) {
  const contact = useQuery(api.contacts.getContact, { id: contactId });
  const pets = useQuery(api.pets.getPetsByContact, { contactId });
  const { results: appointments, status, loadMore } = usePaginatedQuery(
    api.appointments.getAppointmentsByContact,
    { contactId },
    { initialNumItems: 20 },
  );

  if (contact === undefined || pets === undefined) {
    return <p className="text-text-secondary text-sm">Loading…</p>;
  }

  if (contact === null) {
    return <p className="text-danger text-sm">Client not found.</p>;
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <Icon name="chevron-left" className="w-4 h-4" />
        Back to Clients
      </button>

      {/* Client info */}
      <section className="mb-8">
        <h1 className="text-title text-text-primary mb-4">{contact.client_name}</h1>

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
      </section>

      {/* Pets */}
      <section className="mb-8">
        <h2 className="text-subtitle text-text-primary mb-3 flex items-center gap-2">
          <Icon name="paw" className="w-5 h-5 text-text-muted" />
          Pets ({pets?.length ?? 0})
        </h2>

        {pets?.length === 0 ? (
          <p className="text-sm text-text-muted">No pets on file.</p>
        ) : (
          <div className="space-y-2">
            {pets.map((pet) => (
              <div key={pet._id} className="text-sm">
                <span className="font-medium text-text-primary">
                  {pet.name || <span className="text-text-muted italic">Unknown name</span>}
                </span>
                <span className="text-text-muted">
                  {" — "}
                  {pet.species && pet.species !== pet.breed
                    ? `${pet.species} · ${pet.breed}`
                    : pet.breed}
                </span>
                {pet.is_active === false && (
                  <span className="ml-2 text-xs text-text-muted bg-background-sidebar px-1.5 py-0.5 rounded">
                    inactive
                  </span>
                )}
                {pet.temperament && (
                  <span className="ml-2 text-xs text-text-secondary">
                    {pet.temperament}
                  </span>
                )}
                {pet.allergies?.length > 0 && (
                  <span className="ml-2 text-xs text-danger">
                    ⚠ {pet.allergies.join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Appointments / Notes */}
      <section>
        <h2 className="text-subtitle text-text-primary mb-3 flex items-center gap-2">
          <Icon name="scissors" className="w-5 h-5 text-text-muted" />
          Appointment History ({appointments?.length ?? 0})
        </h2>

        {status === "LoadingFirstPage" ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : appointments?.length === 0 ? (
          <p className="text-sm text-text-muted">No appointment history.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt._id} className="text-sm border-l-2 border-border pl-3">
                {appt.date && (
                  <p className="text-xs text-text-muted mb-0.5">{appt.date}</p>
                )}
                {appt.groomer && (
                  <p className="text-xs text-text-muted mb-0.5">
                    Groomer: {appt.groomer}
                  </p>
                )}
                {appt.price != null && (
                  <p className="text-xs text-text-muted mb-0.5">
                    Price: ${appt.price}
                  </p>
                )}
                <p className="text-text-secondary whitespace-pre-wrap">
                  {appt.note_text}
                </p>
              </div>
            ))}

            {status === "CanLoadMore" && (
              <button
                onClick={() => loadMore(20)}
                className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
