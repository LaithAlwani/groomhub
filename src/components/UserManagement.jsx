import { useState } from "react";
import { useOrganization } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";
import {
  GROOMER_COLOR_KEYS,
  GROOMER_COLOR_LABELS,
  GROOMER_SWATCH_CLASSES,
  defaultGroomerColor,
} from "../constants/groomerColors";
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

  const groomers      = useQuery(api.users.listGroomers);
  const setUserColor  = useMutation(api.users.setUserColor);

  const [modalMode,       setModalMode]       = useState(null);
  const [editTarget,      setEditTarget]      = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionError,     setActionError]     = useState("");

  function findGroomer(tokenId) {
    return (groomers ?? []).find((g) => g.tokenIdentifier === tokenId) ?? null;
  }

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
            const tokenId  = m.publicUserData?.userId;
            const isSelf   = tokenId === user.userId;
            const name     = [m.publicUserData?.firstName, m.publicUserData?.lastName]
              .filter(Boolean).join(" ") || m.publicUserData?.identifier || "Unknown";
            const email    = m.publicUserData?.identifier ?? "";
            const groomer  = findGroomer(tokenId);
            const activeColor = groomer?.color ?? defaultGroomerColor(tokenId);
            const isExplicit  = !!groomer?.color;

            async function handlePickColor(key) {
              setActionError("");
              try {
                await setUserColor({ userId: groomer._id, color: key });
              } catch (err) {
                setActionError(err.message ?? "Failed to update color");
              }
            }

            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-background-sidebar rounded-xl"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  {/* Current schedule color indicator */}
                  {groomer && (
                    <span
                      title={`Color: ${GROOMER_COLOR_LABELS[activeColor]}${isExplicit ? "" : " (auto)"}`}
                      className={`w-3 h-3 rounded-full shrink-0 ${GROOMER_SWATCH_CLASSES[activeColor]} ${
                        isExplicit ? "" : "opacity-60"
                      }`}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role] ?? ROLE_BADGE["org:member"]}`}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Inline color picker — small circles, only shown once the staff member
                      has signed in at least once (which creates their Convex users row). */}
                  {groomer && (
                    <div className="flex items-center gap-1">
                      {GROOMER_COLOR_KEYS.map((key) => {
                        const isActive = isExplicit && key === activeColor;
                        return (
                          <button
                            key={key}
                            onClick={() => handlePickColor(key)}
                            title={GROOMER_COLOR_LABELS[key]}
                            className={`w-3.5 h-3.5 rounded-full ${GROOMER_SWATCH_CLASSES[key]} transition-all ${
                              isActive
                                ? "ring-2 ring-offset-1 ring-text-primary ring-offset-background-sidebar"
                                : "hover:scale-125"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

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
