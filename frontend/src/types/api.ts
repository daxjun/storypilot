/**
 * Response shapes for the frontend service layer.
 *
 * These are PROPOSED view models built from the backend models in
 * episode.ts / candidate.ts / evaluation.ts. Agree on final shapes with the
 * backend developer; the UI only depends on these types, so differences can
 * be absorbed in src/services without touching components.
 */
import type { Episode, EpisodeListItem, EpisodeStats, ScreenplaySegment } from "./episode";
import type { CandidateListItem } from "./candidate";
import type { EditorialEvaluation } from "./evaluation";

export type PipelineStageStatus = "completed" | "in_progress" | "pending" | "failed";

export interface PipelineStage {
  key: "ingestion" | "generation" | "deduplication" | "evaluation" | "ranking";
  label: string;
  status: PipelineStageStatus;
  detail?: string | null;
}

export type ActivityType =
  | "episode_processed"
  | "episode_failed"
  | "candidates_generated"
  | "evaluation_completed"
  | "evaluation_failed";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string; // ISO 8601
  episode_id?: string | null;
  candidate_id?: string | null;
}

export interface DashboardStats {
  episodes_processed: number;
  episodes_total: number;
  total_segments: number;
  candidates_generated: number;
  shortlisted_candidates: number;
  evaluations_completed: number;
  evaluation_failures: number;
  pipeline: PipelineStage[];
  candidates_per_episode: { episode_id: string; episode_number: number; candidates: number }[];
  /** Final editorial scores of completed evaluations (from the backend). */
  final_scores: number[];
  recent_activity: ActivityEvent[];
}

export interface EpisodeDetail extends Episode {
  stats: EpisodeStats;
  candidates: CandidateListItem[];
}

export interface CandidateDetail {
  candidate: CandidateListItem;
  episode: Pick<Episode, "episode_id" | "episode_number" | "logline" | "show_id">;
  /** Screenplay segments covered by the candidate, in order. */
  segments: ScreenplaySegment[];
  /** Null when the candidate has not been sent for evaluation. */
  evaluation: EditorialEvaluation | null;
}

export interface RankingEntry {
  rank: number;
  candidate: CandidateListItem;
  hook: string | null;
  cliffhanger: string | null;
  final_editorial_score: number;
}

export interface EditorialRankings {
  /** Successfully evaluated candidates, ordered by backend final score (desc). */
  ranked: RankingEntry[];
  /** Candidates intentionally left out of the ranking, with their status. */
  excluded: CandidateListItem[];
}

export interface EvaluationStatusRow {
  candidate_id: string;
  episode_id: string;
  episode_number: number;
  status: "completed" | "failed" | "pending";
  final_editorial_score?: number | null;
  error_message?: string | null;
  updated_at?: string | null;
}

export interface EvaluationStatusSummary {
  total_selected: number;
  completed: number;
  failed: number;
  pending: number;
  rows: EvaluationStatusRow[];
}

export type { EpisodeListItem };
