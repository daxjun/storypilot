import { FEATURES, isMockMode } from "@/lib/config";
import type { EditorialRankings, EvaluationStatusSummary } from "@/types/api";
import { ApiError, apiFetch, ENDPOINTS } from "./api";
import { mockGetEditorialRankings, mockGetEvaluationStatus } from "./mock-handlers";

type BackendEvaluationStatusSummary = Omit<EvaluationStatusSummary, "rows"> & {
  rows: (Omit<EvaluationStatusSummary["rows"][number], "status"> & {
    status: "completed" | "evaluated" | "failed" | "pending" | "shortlisted";
  })[];
};

export function getEditorialRankings(): Promise<EditorialRankings> {
  return isMockMode ? mockGetEditorialRankings() : apiFetch(ENDPOINTS.rankings());
}

export async function getEvaluationStatus(): Promise<EvaluationStatusSummary> {
  if (isMockMode) {
    return mockGetEvaluationStatus();
  }

  const result = await apiFetch<BackendEvaluationStatusSummary>(
    ENDPOINTS.evaluationStatus(),
  );

  return {
    ...result,
    rows: result.rows.map((row) => ({
      ...row,
      status:
        row.status === "evaluated"
          ? "completed"
          : row.status === "shortlisted"
            ? "pending"
            : row.status,
    })),
  };
}

/**
 * Re-queue a failed evaluation. Only usable when the backend exposes the
 * endpoint and FEATURES.retryEvaluation is enabled. Never simulated in mock mode.
 */
export async function retryEvaluation(candidateId: string): Promise<void> {
  if (!FEATURES.retryEvaluation || isMockMode) {
    throw new ApiError("Retrying evaluations is not available yet.");
  }

  await apiFetch(ENDPOINTS.retryEvaluation(candidateId), { method: "POST" });
}