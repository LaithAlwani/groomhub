import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";
import UserFormModal from "./UserFormModal";

export default function UserManagement() {
  const { user } = useAuth();
  const users = useQuery(api.users.listUsers, { sessionToken: user.sessionToken });
  const deleteUser    = useMutation(api.users.deleteUser);
  const resetLockout  = useMutation(api.users.resetLockout);

  const [modalMode,       setModalMode]       = useState(null); // null | "add" | "edit"
  const [editTarget,      setEditTarget]      = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionError,     setActionError]     = useState("");

  function openAdd() {
    setEditTarget(null);
    setModalMode("add");
  }

  function openEdit(u) {
    setEditTarget(u);
    setModalMode("edit");
  }

  async function handleDelete(userId) {
    setActionError("");
    try {
      await deleteUser({ sessionToken: user.sessionToken, userId });
      setConfirmDeleteId(null);
    } catch (err) {
      setActionError(err.message ?? "Failed to delete user");
    }
  }

  async function handleResetLockout(userId) {
    setActionError("");
    try {
      await resetLockout({ sessionToken: user.sessionToken, userId });
    } catch (err) {
      setActionError(err.message ?? "Failed to reset lockout");
    }
  }

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
          Add User
        </button>
      </div>

      {/* Error */}
      {actionError && (
        <p className="mb-4 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
          {actionError}
        </p>
      )}

      {/* User list */}
      {users === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-background-sidebar rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No users found.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isLocked = (u.failed_attempts ?? 0) >= 3;
            const isSelf   = u._id === user.userId;

            return (
              <div
                key={u._id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-background-sidebar rounded-xl"
              >
                {/* Identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {u.displayName}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.isAdmin
                          ? "bg-primary-light text-primary"
                          : "bg-border text-text-secondary"
                      }`}
                    >
                      {u.isAdmin ? "Admin" : "Staff"}
                    </span>
                    {isLocked && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-tag-red text-tag-redText">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">@{u.username}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isLocked && (
                    <button
                      onClick={() => handleResetLockout(u._id)}
                      className="text-xs text-primary hover:text-primary-hover font-medium px-2 py-1 rounded-lg hover:bg-primary-light transition-colors"
                    >
                      Unlock
                    </button>
                  )}

                  <button
                    onClick={() => openEdit(u)}
                    className="p-1.5 text-text-muted hover:text-text-primary hover:bg-ui-active rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Icon name="edit" className="w-4 h-4" />
                  </button>

                  {!isSelf && (
                    confirmDeleteId === u._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(u._id)}
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
                        onClick={() => { setConfirmDeleteId(u._id); setActionError(""); }}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-tag-red rounded-lg transition-colors"
                        title="Delete"
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
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  );
}
