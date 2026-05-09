import { useState } from "react";
import Icon from "../assets/Icon";
import { STATUS_BADGE, STATUS_LABEL } from "../constants/appointments";
import { matchesUser } from "../utils/userMatch";

function formatTime(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AppointmentRow({
  appt, user, onEdit, onDelete, onApprove, onReject, onCancel, onCheckIn, onNoShow,
  confirmDelete, onConfirmDelete, onCancelDelete,
}) {
  const [expanded,        setExpanded]        = useState(false);
  const [approveLoading,  setApproveLoading]  = useState(false);
  const [rejectLoading,   setRejectLoading]   = useState(false);
  const [cancelLoading,   setCancelLoading]   = useState(false);
  const [checkInLoading,  setCheckInLoading]  = useState(false);
  const [noShowLoading,   setNoShowLoading]   = useState(false);

  const status           = appt.status ?? "completed";
  const isPending        = status === "pending";
  const isConfirmed      = status === "confirmed";
  const isCheckedIn      = status === "checked_in";
  const timeFmt          = formatTime(appt.time);
  const isOwnAppt        = matchesUser(appt.createdById, user?.userId) || matchesUser(appt.groomerId, user?.userId);
  const canAct           = user?.isAdmin || isOwnAppt;
  const canActOnPending  = isPending && (user?.isAdmin || matchesUser(appt.groomerId, user?.userId));

  return (
    <div className="px-5 py-4 hover:bg-ui-hover transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-28 shrink-0">
          {appt.date
            ? <p className="flex items-center gap-1 text-[10px] text-text-primary"><Icon name="calendar" className="w-3 h-3" />{appt.date}</p>
            : <p className="text-xs text-text-muted italic">History</p>
          }
          {timeFmt && <p className="text-[10px] text-text-muted mt-0.5">{timeFmt}</p>}
          <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${STATUS_BADGE[status] ?? STATUS_BADGE.completed}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {appt.service_type && (
              <span className="text-xs font-medium text-text-primary bg-background-sidebar px-2 py-0.5 rounded-full">
                {appt.service_type}
              </span>
            )}
            {appt.groomer && (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
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
              {(appt.note_text ?? "").split("\n").filter((l) => l.trim()).map((line, i) => (
                <p key={i} className="text-sm text-text-secondary leading-relaxed px-5 py-2">{line}</p>
              ))}
            </div>
          ) : appt.note_text ? (
            <>
              <p
                className={`text-sm text-text-secondary leading-relaxed cursor-pointer ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}
                onClick={() => setExpanded((v) => !v)}
              >
                {appt.note_text}
              </p>
              {appt.note_text.length > 100 && (
                <button onClick={() => setExpanded((v) => !v)} className="text-xs text-primary hover:text-primary-hover mt-0.5 transition-colors">
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-text-muted italic">No notes</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            {canActOnPending && onApprove && (
              <button
                disabled={approveLoading}
                onClick={async () => {
                  setApproveLoading(true);
                  try { await onApprove(); } finally { setApproveLoading(false); }
                }}
                className="text-xs font-medium bg-primary-light text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {approveLoading ? "…" : "Approve"}
              </button>
            )}
            {canActOnPending && onReject && (
              <button
                disabled={rejectLoading}
                onClick={async () => {
                  setRejectLoading(true);
                  try { await onReject(); } finally { setRejectLoading(false); }
                }}
                className="text-xs font-medium text-danger hover:bg-tag-red px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {rejectLoading ? "…" : "Reject"}
              </button>
            )}
            {isConfirmed && canAct && onCheckIn && (
              <button
                disabled={checkInLoading}
                onClick={async () => {
                  setCheckInLoading(true);
                  try { await onCheckIn(); } finally { setCheckInLoading(false); }
                }}
                className="text-xs font-medium bg-primary-light text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {checkInLoading ? "…" : "Check in"}
              </button>
            )}
            {isConfirmed && canAct && onNoShow && (
              <button
                disabled={noShowLoading}
                onClick={async () => {
                  setNoShowLoading(true);
                  try { await onNoShow(); } finally { setNoShowLoading(false); }
                }}
                className="text-xs font-medium text-text-secondary hover:bg-ui-active px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {noShowLoading ? "…" : "No-show"}
              </button>
            )}
            {isCheckedIn && canAct && (
              <button
                onClick={onEdit}
                className="text-xs font-medium bg-success-light text-success-text hover:bg-success/20 border border-success/30 px-2.5 py-1 rounded-lg transition-colors"
              >
                Complete
              </button>
            )}
            {(isPending || isConfirmed) && canAct && onCancel && (
              <button
                disabled={cancelLoading}
                onClick={async () => {
                  setCancelLoading(true);
                  try { await onCancel(); } finally { setCancelLoading(false); }
                }}
                className="text-xs font-medium text-danger hover:bg-tag-red px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLoading ? "…" : "Cancel"}
              </button>
            )}
            {(user?.isAdmin || isOwnAppt) && (
              <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors">
                <Icon name="edit" className="w-3.5 h-3.5" />
              </button>
            )}
            {user?.isSuperAdmin && (
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
