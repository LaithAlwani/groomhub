import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 bg-background-card";
const INPUT_OK  = `${INPUT} border-border focus:ring-primary`;
const INPUT_ERR = `${INPUT} border-danger focus:ring-danger`;

function fieldCls(err) { return err ? INPUT_ERR : INPUT_OK; }

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError,   setSaveError]   = useState("");

  function clearErr(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const errors = {};

    if (!displayName.trim())
      errors.displayName = "Display name is required.";
    else if (displayName.trim().length < 2)
      errors.displayName = "Display name must be at least 2 characters.";

    if (!username.trim())
      errors.username = "Username is required.";
    else if (username.trim().length < 2)
      errors.username = "Username must be at least 2 characters.";
    else if (!/^[a-z0-9_]+$/.test(username.trim()))
      errors.username = "Username may only contain lowercase letters, numbers, and underscores.";

    if (!isEdit && !pin)
      errors.pin = "Passcode is required.";
    else if (pin && pin.length < 6)
      errors.pin = "Passcode must be at least 6 characters.";

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateUser({
          sessionToken: user.sessionToken,
          userId:       target._id,
          displayName:  displayName.trim(),
          username:     username.trim(),
          pin:          pin || undefined,
          isAdmin,
        });
      } else {
        await createUser({
          sessionToken: user.sessionToken,
          displayName:  displayName.trim(),
          username:     username.trim(),
          pin,
          isAdmin,
        });
      }
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Something went wrong");
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
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
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
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); clearErr("displayName"); }}
              placeholder="e.g. Sarah"
              className={fieldCls(fieldErrors.displayName)}
            />
            {fieldErrors.displayName && <p className="text-xs text-danger mt-1">{fieldErrors.displayName}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Username <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value.toLowerCase()); clearErr("username"); }}
              placeholder="e.g. sarah"
              className={fieldCls(fieldErrors.username)}
            />
            {fieldErrors.username
              ? <p className="text-xs text-danger mt-1">{fieldErrors.username}</p>
              : <p className="text-xs text-text-muted mt-1">Lowercase letters, numbers, and underscores only.</p>
            }
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Passcode {!isEdit && <span className="text-danger">*</span>}
              {isEdit && (
                <span className="ml-1 text-xs text-text-muted font-normal">(leave blank to keep current)</span>
              )}
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); clearErr("pin"); }}
              placeholder={isEdit ? "Enter new passcode to change" : "Min. 6 characters"}
              className={fieldCls(fieldErrors.pin)}
            />
            {fieldErrors.pin && <p className="text-xs text-danger mt-1">{fieldErrors.pin}</p>}
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
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
