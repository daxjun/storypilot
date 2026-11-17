import { isMockMode } from "@/lib/config";
import type { DashboardStats } from "@/types/api";
import { apiFetch, ENDPOINTS } from "./api";
import { mockGetDashboardStats } from "./mock-handlers";

export function getDashboardStats(): Promise<DashboardStats> {
  return isMockMode ? mockGetDashboardStats() : apiFetch(ENDPOINTS.dashboard());
}

/** Lightweight connectivity check against the configured backend. */
export async function checkBackendHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    await apiFetch<unknown>(ENDPOINTS.health());
    return { ok: true, message: "Backend is reachable." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}
