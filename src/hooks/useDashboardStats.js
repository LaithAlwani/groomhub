import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function localDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useDashboardStats() {
  const today    = localDateString();
  const stats    = useQuery(api.dashboard.getStats,          { today });
  const activity = useQuery(api.dashboard.getRecentActivity);
  return { stats, activity };
}
