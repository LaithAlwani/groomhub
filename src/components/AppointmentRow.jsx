import { useState } from "react";
import Icon from "../assets/Icon";

export default function AppointmentRow({ appt, user, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-5 py-4 hover:bg-ui-hover transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-24 shrink-0">
          {appt.date
            ? <p className="flex items-center gap-1 text-[10px] text-text-primary"><Icon name="calendar" className="w-3 h-3" />{appt.date}</p>
            : <p className="text-xs text-text-muted italic">History</p>
          }
        </div>

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
