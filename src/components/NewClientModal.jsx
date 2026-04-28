import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";

const INPUT = "w-full border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 bg-background-card";
const INPUT_OK  = `${INPUT} border-border focus:ring-primary`;
const INPUT_ERR = `${INPUT} border-danger focus:ring-danger`;

function fieldCls(err) { return err ? INPUT_ERR : INPUT_OK; }

export default function NewClientModal({ onClose }) {
  const createContact = useMutation(api.clients.createClient);

  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [phone,         setPhone]         = useState("");
  const [email,         setEmail]         = useState("");
  const [emailDeclined, setEmailDeclined] = useState(false);
  const [address,       setAddress]       = useState("");
  const [city,          setCity]          = useState("");
  const [province,      setProvince]      = useState("");
  const [postalCode,    setPostalCode]    = useState("");
  const [loading,       setLoading]       = useState(false);
  const [fieldErrors,   setFieldErrors]   = useState({});
  const [saveError,     setSaveError]     = useState("");

  function clearErr(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const errors = {};
    if (!firstName.trim())              errors.firstName = "First name is required.";
    if (!lastName.trim())               errors.lastName  = "Last name is required.";
    if (!phone.trim())                  errors.phone     = "Phone number is required.";
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
      await createContact({
        first_name:  firstName.trim(),
        last_name:   lastName.trim(),
        phones:      [{ number: phone.trim(), type: "main" }],
        email:       emailDeclined ? undefined : email.trim(),
        address:     address.trim() || undefined,
        city:        city.trim() || undefined,
        province:    province.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to create client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-subtitle text-text-primary">New Client</h2>
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
                placeholder="Jane"
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
                placeholder="Smith"
              />
              {fieldErrors.lastName && <p className="text-xs text-danger mt-1">{fieldErrors.lastName}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Phone Number <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Icon name="phone-work" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearErr("phone"); }}
                className={`${fieldCls(fieldErrors.phone)} pl-9`}
                placeholder="613-555-0100"
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-danger mt-1">{fieldErrors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email Address <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Icon name="mail" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                disabled={emailDeclined}
                onChange={(e) => { setEmail(e.target.value); clearErr("email"); }}
                className={`${fieldCls(fieldErrors.email)} pl-9 disabled:opacity-40 disabled:cursor-not-allowed`}
                placeholder="jane@example.com"
              />
            </div>
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

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Home Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={INPUT_OK}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={INPUT_OK}
                placeholder="Ottawa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Province</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className={INPUT_OK}
                placeholder="ON"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className={INPUT_OK}
                placeholder="K1A 0A1"
              />
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
              {loading ? "Saving…" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
