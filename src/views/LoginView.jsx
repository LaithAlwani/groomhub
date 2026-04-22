import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../assets/Icon";

function SetupView() {
  const bootstrap = useMutation(api.users.bootstrapSuperAdmin);
  const { login } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username,    setUsername]    = useState("");
  const [pin,         setPin]         = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await bootstrap({ displayName: displayName.trim(), username: username.trim(), pin });
      await login(username.trim(), pin);
    } catch (err) {
      setError(err.message ?? "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-background-card rounded-2xl shadow-soft p-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="scissors" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-subtitle text-text-primary">GroomHub Setup</h1>
          <p className="text-sm text-text-muted mt-1">Create your Super Admin account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Passcode <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Min. 4 characters"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-tag-red rounded-xl px-3 py-2.5 text-sm">
              <Icon name="alert" className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-xl py-2 text-sm transition-colors"
          >
            {loading ? "Creating account…" : "Create Super Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginView() {
  const hasUsers = useQuery(api.users.hasAnyUsers);
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [pin,      setPin]      = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const isLocked = error.toLowerCase().includes("locked");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), pin);
    } catch (err) {
      setError(err.message ?? "Login failed");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  if (hasUsers === undefined) return null;
  if (hasUsers === false) return <SetupView />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-background-card rounded-2xl shadow-soft p-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="scissors" className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-subtitle text-text-primary">GroomHub</h1>
          <p className="text-sm text-text-muted mt-1">Internal Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <div className="relative">
              <Icon name="user" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Passcode</label>
            <div className="relative">
              <Icon name="shield" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary bg-background-card"
                placeholder="Enter your passcode"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-tag-red rounded-xl px-3 py-2.5 text-sm">
              <Icon name={isLocked ? "shield" : "alert"} className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-danger">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium rounded-xl py-2 text-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
