import { useState, useRef } from "react";
import { useOrganizationList, useClerk } from "@clerk/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Icon from "../assets/Icon";
import { useAuth } from "../context/AuthContext";

export default function CreateShopView() {
  const { createOrganization, setActive } = useOrganizationList();
  const { signOut }                        = useClerk();
  const { shopCreateError, setPendingLogoStorageId } = useAuth();
  const generateUploadUrl = useMutation(api.shops.generateLogoUploadUrl);

  const [step,          setStep]          = useState("choose"); // "choose" | "create" | "join"
  const [name,          setName]          = useState("");
  const [loading,       setLoading]       = useState(false);
  const [settling,      setSettling]      = useState(false);
  const [error,         setError]         = useState("");
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method:  "POST",
        headers: { "Content-Type": file.type },
        body:    file,
      });
      const { storageId } = await res.json();
      setPendingLogoStorageId(storageId);
    } catch {
      // Non-critical
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Shop name is required."); return; }
    setLoading(true);
    setError("");
    try {
      const org = await createOrganization({ name: trimmed });
      if (setActive) await setActive({ organization: org.id });
      setSettling(true);
    } catch (err) {
      setError(err.errors?.[0]?.longMessage ?? err.message ?? "Failed to create shop");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="scissors" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">GroomHub</h1>
          <p className="text-sm text-text-muted mt-1">
            {step === "choose" && "How would you like to get started?"}
            {step === "create" && "Set up your shop"}
            {step === "join"   && "Joining an existing shop"}
          </p>
        </div>

        {/* ── Step: choose ── */}
        {step === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("create")}
              className="w-full bg-background-card border border-border rounded-2xl p-5 text-left hover:border-primary/50 hover:shadow-soft transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Icon name="scissors" className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Open a new shop</p>
                  <p className="text-sm text-text-muted mt-0.5">
                    I'm setting up a grooming shop on GroomHub for the first time
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep("join")}
              className="w-full bg-background-card border border-border rounded-2xl p-5 text-left hover:border-primary/50 hover:shadow-soft transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-background-sidebar flex items-center justify-center shrink-0 group-hover:bg-primary-light transition-colors">
                  <Icon name="user" className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Join a shop</p>
                  <p className="text-sm text-text-muted mt-0.5">
                    My shop is already on GroomHub and I need to join the team
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Step: join ── */}
        {step === "join" && (
          <div className="bg-background-card border border-border rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-background-sidebar flex items-center justify-center shrink-0">
                <Icon name="user" className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Check your email</h2>
                <p className="text-xs text-text-muted mt-0.5">An invite is required to join</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-text-secondary">
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p>Ask your shop admin to go to <span className="font-medium text-text-primary">Admin → Staff Accounts</span> and invite you using your email address.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p>You'll receive an invitation email. Click the link inside to automatically join the shop.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p>Come back and sign in — you'll go straight into the shop.</p>
              </div>
            </div>

            <button
              onClick={() => setStep("choose")}
              className="mt-6 w-full border border-border text-text-secondary rounded-xl py-2 text-sm font-medium hover:bg-ui-hover transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step: create ── */}
        {step === "create" && (
          <div className="bg-background-card border border-border rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <Icon name="scissors" className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Create Your Shop</h2>
                <p className="text-xs text-text-muted mt-0.5">You'll be the Super Admin</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Logo picker */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={settling}
                  className="relative w-20 h-20 rounded-2xl bg-primary-light border-2 border-dashed border-primary/30 hover:border-primary/60 flex items-center justify-center overflow-hidden transition-colors group disabled:pointer-events-none"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Shop icon" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="scissors" className="w-8 h-8 text-primary/40 group-hover:text-primary/70 transition-colors" />
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <p className="text-xs text-text-muted">Shop icon <span className="opacity-60">(optional)</span></p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Shop Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="e.g. Paws & Claws Grooming"
                  autoFocus
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 bg-background-card transition-colors ${
                    error ? "border-danger focus:ring-danger/50" : "border-border focus:ring-primary/50"
                  }`}
                />
                {error && <p className="text-xs text-danger mt-1">{error}</p>}
              </div>

              {settling ? (
                <div className="flex items-center justify-center gap-2 text-sm text-text-secondary py-2">
                  <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Setting up your shop…
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("choose")}
                    className="flex-1 border border-border text-text-secondary rounded-xl py-2.5 text-sm font-medium hover:bg-ui-hover transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || logoUploading}
                    className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                  >
                    {loading ? "Creating…" : "Create Shop"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {shopCreateError && (
          <div className="mt-4 rounded-xl border border-danger bg-danger/10 px-4 py-3 text-xs text-danger">
            {shopCreateError}
          </div>
        )}

        <button
          onClick={() => signOut()}
          className="mt-4 w-full text-xs text-text-muted hover:text-text-secondary transition-colors text-center"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
