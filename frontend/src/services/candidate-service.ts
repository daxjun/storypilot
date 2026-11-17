import { isMockMode } from "@/lib/config";
import type { CandidateDetail } from "@/types/api";
import type { CandidateListItem } from "@/types/candidate";
import { apiFetch, ENDPOINTS } from "./api";
import { mockGetCandidateById, mockGetCandidates } from "./mock-handlers";

export function getCandidates(): Promise<CandidateListItem[]> {
  return isMockMode ? mockGetCandidates() : apiFetch(ENDPOINTS.candidates());
}

export function getCandidateById(candidateId: string): Promise<CandidateDetail> {
  return isMockMode
    ? mockGetCandidateById(candidateId)
    : apiFetch(ENDPOINTS.candidate(candidateId));
}
