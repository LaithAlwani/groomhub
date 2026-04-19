import { createContext, useContext, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const loginMutation = useMutation(api.users.login);
  const logoutMutation = useMutation(api.users.logout);

  async function login(username, pin) {
    const result = await loginMutation({ username, pin });
    if (!result.ok) throw new Error(result.error);
    setUser(result);
    return result;
  }

  async function logout() {
    if (user?.sessionToken) {
      try { await logoutMutation({ sessionToken: user.sessionToken }); } catch {}
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
