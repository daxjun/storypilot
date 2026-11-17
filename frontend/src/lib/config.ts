/**
 * Runtime configuration (public, non-secret values only).
 *
 * Never put API keys or secrets here — anything prefixed NEXT_PUBLIC_ is
 * shipped to the browser. Gemini credentials live on the backend only.
 */

export type DataMode = "mock" | "api";

export const DATA_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "mock";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export const isMockMode = DATA_MODE === "mock";

/**
 * Backend capabilities that are not available yet.
 * Flip a flag only once the backend exposes the matching endpoint.
 */
export const FEATURES = {
  retryEvaluation: process.env.NEXT_PUBLIC_FEATURE_RETRY_EVALUATION === "true",
} as const;
