import { useState } from "react";
import { useOrganization } from "@clerk/react";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";
import UserFormModal from "./UserFormModal";

const ROLE_BADGE = {
  "org:super_admin": "bg-yellow-100 text-yellow-700",
  "org:admin":       "bg-primary-light text-primary",
  "org:member":      "bg-border text-text-secondary",
};

const ROLE_LABEL = {
  "org:super_admin": "Super Admin",
  "org:admin":       "Admin",
  "org:member":      "Staff",
};

export default function UserManagement() {
  const { user } = useAuth();
  const { memberships, organization } = useOrganization({
    memberships: { pageSize: 50, keepPreviousData: true },
  });

  const [modalMode,       setModalMode]       = useState(null);
  const [editTarget,      setEditTarget]      = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionError,     setActionError]     = useState("");

  function openAdd() {
    setEditTarget(null);
    setModalMode("add");
  }

  function openEdit(membership) {
    setEditTarget(membership);
    setModalMode("edit");
  }

  async function handleDelete(membership) {
    setActionError("");
    try {
      await membership.destroy();
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(err.message ?? "Failed to remove user");
    }
  }

  function canEdit(membership) {
    if (user.isSuperAdmin) return true;
    return membership.role !== "org:super_admin";
  }

  const memberList = memberships?.data ?? [];

  return (
    <div className="bg-background-card border border-border rounded-2xl p-6 shadow-card max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Icon name="user" className="w-4 h-4 text-text-muted" />
          <h2 className="font-semibold text-text-primary">Staff Accounts</h2>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {actionError && (
        <p className="mb-4 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
          {actionError}
        </p>
      )}

      {memberships === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-background-sidebar rounded-xl animate-pulse" />
          ))}
        </div>
      ) : memberList.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No staff found.</p>
      ) : (
        <div className="space-y-2">
          {memberList.map((m) => {
            const isSelf   = m.publicUserData?.userId === user.userId;
            const name     = [m.publicUserData?.firstName, m.publicUserData?.lastName]
              .filter(Boolean).join(" ") || m.publicUserData?.identifier || "Unknown";
            const email    = m.publicUserData?.identifier ?? "";

            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-background-sidebar rounded-xl"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role] ?? ROLE_BADGE["org:member"]}`}>
                      {ROLE_LABEL[m.role] ?? m.role}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{email}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canEdit(m) && (
                    <button
                      onClick={() => openEdit(m)}
                      className="p-1.5 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors"
                      title="Edit role"
                    >
                      <Icon name="edit" className="w-4 h-4" />
                    </button>
                  )}

                  {user.isSuperAdmin && !isSelf && (
                    confirmDeleteId === m.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(m)}
                          className="text-xs font-medium text-white bg-danger hover:bg-danger/90 px-2 py-1 rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg hover:bg-ui-hover transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(m.id); setActionError(""); }}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-tag-red rounded-lg transition-colors"
                        title="Remove from organization"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalMode && (
        <UserFormModal
          mode={modalMode}
          target={editTarget}
          organization={organization}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}
