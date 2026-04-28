import Icon from "../assets/Icon";
import { phoneIcon } from "../utils/phone";

export default function ClientCard({ contact, onClick }) {
  const primaryPhone = contact.phones?.[0] ?? null;
  const petCount     = contact.pet_count ?? 0;
  const lastDate     = contact.last_visit_date ?? null;

  const initials = contact.client_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={() => onClick?.(contact)}
      className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-ui-hover transition-colors group"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-primary-light text-primary text-sm font-bold flex items-center justify-center shrink-0">
        {initials}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors capitalize">
            {contact.client_name}
          </p>
          {contact.is_blacklisted && (
            <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-tag-red text-tag-redText">
              Blacklisted
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate mt-0.5">
          {contact.email ?? "No email on file"}
        </p>
      </div>

      {/* Phone */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary w-36 shrink-0">
        {primaryPhone
          ? <>
              <Icon name={phoneIcon(primaryPhone.type)} className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="truncate">{primaryPhone.number}</span>
            </>
          : <span className="text-text-muted text-xs italic">No phone</span>
        }
      </div>

      {/* Last visit */}
      <div className="hidden md:block text-xs text-text-muted w-28 shrink-0">
        {lastDate
          ? <span className="flex items-center gap-1"><Icon name="calendar" className="w-3 h-3" />{lastDate}</span>
          : <span className="italic">No visits yet</span>
        }
      </div>

      {/* Pets badge */}
      <div className="shrink-0">
        {petCount > 0
          ? <span className="flex items-center gap-1 text-xs text-text-muted bg-background-sidebar rounded-full px-2.5 py-1">
              <Icon name="paw" className="w-3 h-3" />
              {petCount}
            </span>
          : <span className="text-xs text-border px-2.5 py-1">—</span>
        }
      </div>

      {/* Arrow */}
      <Icon name="chevron-left" className="w-4 h-4 text-text-muted rotate-180 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
