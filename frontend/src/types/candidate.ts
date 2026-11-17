/**
 * Promotional clip candidate contracts.
 */

/** Heuristic signals recorded during candidate generation. Shape is backend-defined. */
export type CandidateSignals = Record<string, number | string | boolean | null>;

export interface Candidate {
  candidate_id: string;
  episode_id: string;
  /** Screenplay timestamps — not verified video durations. */
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  start_time: string;
  end_time: string;
  segment_ids: string[];
  source_line_start?: number | null;
  source_line_end?: number | null;
  /** Heuristic score from candidate generation (pre-AI). */
  preliminary_score: number;
  signals?: CandidateSignals | null;
}

/**
 * Where a candidate sits in the pipeline, as shown in the UI.
 *
 * - pending      generated and kept after deduplication, not selected for AI evaluation
 * - shortlisted  selected for AI evaluation, result not available yet
 * - evaluated    AI evaluation completed successfully
 * - failed       AI evaluation was attempted and failed
 */
export type CandidateStatus = "pending" | "shortlisted" | "evaluated" | "failed";

/** Candidate row used by listing pages. */
export interface CandidateListItem extends Candidate {
  episode_number: number;
  status: CandidateStatus;
  /** Present only when status === "evaluated". Comes from the backend. */
  final_editorial_score?: number | null;
}
