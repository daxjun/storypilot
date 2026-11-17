/**
 * Central API configuration and HTTP client.
 *
 * Every backend URL lives in ENDPOINTS below. These paths are PROPOSALS —
 * confirm names and response shapes with the backend developer before
 * switching NEXT_PUBLIC_DATA_MODE to "api".
 */
import { API_BASE_URL } from "@/lib/config";

export const ENDPOINTS = {
  health: () => "/health",
  dashboard: () => "/api/dashboard",
  episodes: () => "/api/episodes",
  episode: (episodeId: string) => `/api/episodes/${encodeURIComponent(episodeId)}`,
  candidates: () => "/api/candidates",
  candidate: (candidateId: string) => `/api/candidates/${encodeURIComponent(candidateId)}`,
  rankings: () => "/api/rankings",
  evaluationStatus: () => "/api/evaluations/status",
  /** Not available yet — enable FEATURES.retryEvaluation once the backend ships it. */
  retryEvaluation: (candidateId: string) =>
    `/api/evaluations/${encodeURIComponent(candidateId)}/retry`,
} as const;

export class ApiError extends Error {
  status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(
      `Could not reach the StoryPilot backend at ${API_BASE_URL}. Check that it is running.`,
    );
  }

  if (response.status === 404) throw new NotFoundError();
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = typeof body?.detail === "string" ? body.detail : detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(`Request failed (${response.status}): ${detail}`, response.status);
  }
  return (await response.json()) as T;
}
