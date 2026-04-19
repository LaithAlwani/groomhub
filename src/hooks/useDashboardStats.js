import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

function localDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const today    = localDateString();
  const stats    = useQuery(api.dashboard.getStats,          { sessionToken: user.sessionToken, today });
  const activity = useQuery(api.dashboard.getRecentActivity, { sessionToken: user.sessionToken });
  return { stats, activity };
}
