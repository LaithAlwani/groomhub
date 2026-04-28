import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

const ROLES = [
  { value: "org:member",      label: "Staff"       },
  { value: "org:admin",       label: "Admin"       },
  { value: "org:super_admin", label: "Super Admin" },
];

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 bg-background-card";
const INPUT_OK  = `${INPUT} border-border focus:ring-primary`;
const INPUT_ERR = `${INPUT} border-danger focus:ring-danger`;

export default function UserFormModal({ mode, target, organization, onClose }) {
  const { user } = useAuth();
  const isEdit = mode === "edit";

  const [email,      setEmail]      = useState("");
  const [role,       setRole]       = useState(target?.role ?? "org:member");
  const [loading,    setLoading]    = useState(false);
  const [emailError, setEmailError] = useState("");
  const [saveError,  setSaveError]  = useState("");

  const visibleRoles = ROLES.filter(
    (r) => r.value !== "org:super_admin" || user.isSuperAdmin,
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    setEmailError("");

    if (!isEdit && !email.trim()) {
      setEmailError("Email address is required.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await target.update({ role });
      } else {
        await organization.inviteMember({ emailAddress: email.trim(), role });
      }
      onClose();
    } catch (err) {
      setSaveError(err.errors?.[0]?.longMessage ?? err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">
            {isEdit ? "Edit Role" : "Invite Staff Member"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="staff@example.com"
                className={emailError ? INPUT_ERR : INPUT_OK}
              />
              {emailError
                ? <p className="text-xs text-danger mt-1">{emailError}</p>
                : <p className="text-xs text-text-muted mt-1">An invitation email will be sent to this address.</p>
              }
            </div>
          )}

          {isEdit && (
            <div className="px-4 py-3 bg-background-sidebar rounded-xl">
              <p className="text-sm font-medium text-text-primary">
                {[target?.publicUserData?.firstName, target?.publicUserData?.lastName]
                  .filter(Boolean).join(" ") || target?.publicUserData?.identifier}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{target?.publicUserData?.identifier}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Role <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              {visibleRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    role === r.value
                      ? "bg-primary text-white border-primary"
                      : "border-border text-text-secondary hover:bg-ui-hover"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
              <Icon name="alert" className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm font-medium hover:bg-ui-hover transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-2 text-sm font-medium transition-colors">
              {loading ? "Saving…" : isEdit ? "Save Role" : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
