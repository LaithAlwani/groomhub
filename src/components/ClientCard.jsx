import Icon from "../assets/Icon";

export default function ClientCard({ contact, onClick }) {
  const primaryPhone = contact.phones?.[0]?.number ?? "";
  const phoneType    = contact.phones?.[0]?.type   ?? "unknown";
  const hasEmail     = !!contact.email;
  const petCount     = contact.pet_count ?? 0;

  return (
    <button
      onClick={() => onClick?.(contact)}
      className="bg-background-card border border-border rounded-2xl p-4 text-left shadow-card hover:shadow-soft transition-shadow w-full"
    >
      {/* Name + pet badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-text-primary text-sm leading-tight">
          {contact.client_name}
        </h3>
        {petCount > 0 && (
          <span className="shrink-0 bg-primary-light text-primary text-xs font-medium rounded-full px-2 py-0.5 flex items-center gap-1">
            <Icon name="paw" className="w-3 h-3" />
            {petCount}
          </span>
        )}
      </div>

      {/* Phone */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
        <Icon name="phone-work" className="w-3.5 h-3.5 shrink-0 text-text-muted" />
        <span>{primaryPhone || "—"}</span>
        <span className="ml-1 px-1.5 py-0.5 bg-background-sidebar rounded text-text-muted text-[10px]">
          {phoneType}
        </span>
      </div>

      {/* Email */}
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        <Icon name="mail" className="w-3.5 h-3.5 shrink-0 text-text-muted" />
        {hasEmail ? (
          <span className="text-text-secondary truncate">{contact.email}</span>
        ) : (
          <span className="text-primary">Add email address</span>
        )}
      </div>
    </button>
  );
}
