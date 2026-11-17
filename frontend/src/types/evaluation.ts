/**
 * Editorial evaluation contracts (AI evaluator output).
 */

export interface DimensionScore {
  /** 0–10 */
  score: number;
  rationale: string;
  evidence_segment_ids: string[];
}

export type DimensionKey =
  | "hook_strength"
  | "emotional_intensity"
  | "curiosity_gap"
  | "standalone_readability"
  | "spoiler_safety";

export type EvaluationStatus = "completed" | "failed" | "pending";

export interface EditorialEvaluation {
  candidate_id: string;
  episode_id: string;

  hook?: string | null;
  cliffhanger?: string | null;
  why_it_works?: string | null;
  cliffhanger_evidence_segment_ids?: string[] | null;

  hook_strength?: DimensionScore | null;
  emotional_intensity?: DimensionScore | null;
  curiosity_gap?: DimensionScore | null;
  standalone_readability?: DimensionScore | null;
  spoiler_safety?: DimensionScore | null;

  strengths?: string[] | null;
  weaknesses?: string[] | null;
  risks?: string[] | null;

  /** Weighted score out of 10, computed by the backend. Never computed in the UI. */
  final_editorial_score?: number | null;
  evaluation_status: EvaluationStatus;
  error_message?: string | null;
  evaluated_at?: string | null;
}
