import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 bg-background-card";
const INPUT_OK  = `${INPUT} border-border focus:ring-primary`;
const INPUT_ERR = `${INPUT} border-danger focus:ring-danger`;

function fieldCls(err) { return err ? INPUT_ERR : INPUT_OK; }

export default function EditClientModal({ client, onClose }) {
  const { user } = useAuth();
  const updateClient = useMutation(api.clients.updateClient);

  const [firstName,     setFirstName]     = useState(client.first_name ?? "");
  const [lastName,      setLastName]      = useState(client.last_name  ?? "");
  const [email,         setEmail]         = useState(client.email      ?? "");
  const [emailDeclined, setEmailDeclined] = useState(!client.email);
  const [phones,        setPhones]        = useState(
    client.phones?.length ? client.phones : [{ number: "", type: "main" }],
  );
  const [loading,     setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError,   setSaveError]   = useState("");

  function clearErr(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function setPhone(i, field, value) {
    setPhones((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
    clearErr("phones");
  }

  function addPhone() {
    setPhones((prev) => [...prev, { number: "", type: "mobile" }]);
  }

  function removePhone(i) {
    setPhones((prev) => prev.filter((_, idx) => idx !== i));
  }

  function validate() {
    const errors = {};
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim())  errors.lastName  = "Last name is required.";
    const hasPhone = phones.some((p) => p.number.trim());
    if (!hasPhone) errors.phones = "At least one phone number is required.";
    if (!emailDeclined) {
      if (!email.trim())                          errors.email = "Email is required, or check the box below.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = "Please enter a valid email address.";
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      await updateClient({
        sessionToken: user.sessionToken,
        clientId:     client._id,
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        phones:       phones.filter((p) => p.number.trim()),
        email:        emailDeclined ? undefined : email.trim(),
      });
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to save changes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">Edit Client</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                First Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearErr("firstName"); }}
                className={fieldCls(fieldErrors.firstName)}
              />
              {fieldErrors.firstName && <p className="text-xs text-danger mt-1">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearErr("lastName"); }}
                className={fieldCls(fieldErrors.lastName)}
              />
              {fieldErrors.lastName && <p className="text-xs text-danger mt-1">{fieldErrors.lastName}</p>}
            </div>
          </div>

          {/* Phones */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Phone Numbers <span className="text-danger">*</span>
            </label>
            <div className="space-y-2">
              {phones.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="tel"
                    value={p.number}
                    onChange={(e) => setPhone(i, "number", e.target.value)}
                    placeholder="613-555-0100"
                    className={fieldCls(fieldErrors.phones && !p.number.trim())}
                  />
                  <select
                    value={p.type ?? "main"}
                    onChange={(e) => setPhone(i, "type", e.target.value)}
                    className="border border-border rounded-xl px-2 py-2 text-sm text-text-secondary bg-background-card focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="main">Main</option>
                    <option value="mobile">Mobile</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                  </select>
                  {phones.length > 1 && (
                    <button type="button" onClick={() => removePhone(i)}
                      className="p-2 text-text-muted hover:text-danger transition-colors">
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {fieldErrors.phones && <p className="text-xs text-danger mt-1">{fieldErrors.phones}</p>}
            {phones.length < 5 && (
              <button type="button" onClick={addPhone}
                className="mt-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors flex items-center gap-1">
                <Icon name="plus" className="w-3.5 h-3.5" />
                Add phone
              </button>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              disabled={emailDeclined}
              onChange={(e) => { setEmail(e.target.value); clearErr("email"); }}
              placeholder="jane@example.com"
              className={`${fieldCls(fieldErrors.email)} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
            {fieldErrors.email && <p className="text-xs text-danger mt-1">{fieldErrors.email}</p>}
            <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailDeclined}
                onChange={(e) => { setEmailDeclined(e.target.checked); clearErr("email"); }}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-text-muted">Client declined to provide an email address</span>
            </label>
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
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
