import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

export default function EditClientModal({ client, onClose }) {
  const { user } = useAuth();
  const updateClient = useMutation(api.clients.updateClient);

  const [firstName, setFirstName] = useState(client.first_name ?? "");
  const [lastName,  setLastName]  = useState(client.last_name  ?? "");
  const [email,     setEmail]     = useState(client.email      ?? "");
  const [phones,    setPhones]    = useState(
    client.phones?.length ? client.phones : [{ number: "", type: "main" }],
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function setPhone(i, field, value) {
    setPhones((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function addPhone() {
    setPhones((prev) => [...prev, { number: "", type: "cell" }]);
  }

  function removePhone(i) {
    setPhones((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) { setError("First name is required"); return; }
    setLoading(true);
    try {
      await updateClient({
        sessionToken: user.sessionToken,
        clientId:     client._id,
        first_name:   firstName.trim(),
        last_name:    lastName.trim() || undefined,
        phones:       phones.filter((p) => p.number.trim()),
        email:        email.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to save changes");
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
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
              />
            </div>
          </div>

          {/* Phones */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Phone Numbers
            </label>
            <div className="space-y-2">
              {phones.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="tel"
                    value={p.number}
                    onChange={(e) => setPhone(i, "number", e.target.value)}
                    placeholder="613-555-0100"
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                  />
                  <select
                    value={p.type ?? "main"}
                    onChange={(e) => setPhone(i, "type", e.target.value)}
                    className="border border-border rounded-xl px-2 py-2 text-sm text-text-secondary bg-background-card focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="main">Main</option>
                    <option value="cell">Cell</option>
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-tag-red rounded-xl px-3 py-2">{error}</p>
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
