import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

export default function UserFormModal({ mode, target, onClose }) {
  const { user } = useAuth();
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);

  const isEdit = mode === "edit";

  const [displayName, setDisplayName] = useState(target?.displayName ?? "");
  const [username,    setUsername]    = useState(target?.username    ?? "");
  const [pin,         setPin]         = useState("");
  const [isAdmin,     setIsAdmin]     = useState(target?.isAdmin     ?? false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await updateUser({
          sessionToken: user.sessionToken,
          userId:       target._id,
          displayName,
          username,
          pin:     pin || undefined,
          isAdmin,
        });
      } else {
        await createUser({
          sessionToken: user.sessionToken,
          displayName,
          username,
          pin,
          isAdmin,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">
            {isEdit ? "Edit User" : "Add User"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Display Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Username <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. sarah"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Passcode {!isEdit && <span className="text-danger">*</span>}
              {isEdit && (
                <span className="ml-1 text-xs text-text-muted font-normal">
                  (leave blank to keep current)
                </span>
              )}
            </label>
            <input
              type="password"
              required={!isEdit}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Role <span className="text-danger">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  !isAdmin
                    ? "bg-primary text-white border-primary"
                    : "border-border text-text-secondary hover:bg-ui-hover"
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  isAdmin
                    ? "bg-primary text-white border-primary"
                    : "border-border text-text-secondary hover:bg-ui-hover"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger bg-tag-red rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm font-medium hover:bg-ui-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-2 text-sm font-medium transition-colors"
            >
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
