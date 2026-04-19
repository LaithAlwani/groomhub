import Icon from "../assets/Icon";

export default function ClientCard({ contact, onClick }) {
  const primaryPhone = contact.phones?.[0] ?? null;
  const petCount     = contact.pet_count ?? 0;
  const lastDate     = contact.last_visit_date ?? null;
  const lastNote     = contact.last_visit_text ?? null;

  return (
    <button
      onClick={() => onClick?.(contact)}
      className="w-full text-left bg-background-card rounded-xl shadow-card border border-border px-5 py-4 hover:border-primary hover:shadow-soft transition-all duration-150 cursor-pointer"
    >
      {/* Name + pet count */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-text-primary truncate">
          {contact.client_name}
        </span>
        {petCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-text-muted bg-background-sidebar rounded-full px-2.5 py-0.5 shrink-0">
            <Icon name="paw" className="w-3 h-3 text-text-muted" />
            {petCount}
          </span>
        )}
      </div>

      {/* Phone */}
      {primaryPhone && (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-text-secondary">
          <Icon name="phone-work" className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span>{primaryPhone.number}</span>
          {primaryPhone.type && (
            <span className="text-xs text-text-muted">· {primaryPhone.type}</span>
          )}
        </div>
      )}

      {/* Email */}
      <div className="mt-1.5 flex items-center gap-1.5 text-sm">
        <Icon name="mail" className="w-3.5 h-3.5 text-text-muted shrink-0" />
        {contact.email
          ? <span className="text-text-secondary truncate">{contact.email}</span>
          : <span className="text-text-muted italic">No email on file</span>
        }
      </div>

      {/* Last visit */}
      {(lastDate || lastNote) && (
        <div className="mt-2.5 border-t border-border pt-2.5 flex flex-col gap-1">
          {lastDate && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Icon name="calendar" className="w-3 h-3 text-text-muted shrink-0" />
              <span>Last visit: {lastDate}</span>
            </div>
          )}
          {lastNote && (
            <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
              {lastNote}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
