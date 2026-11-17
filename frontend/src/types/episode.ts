/**
 * Episode & screenplay contracts.
 *
 * Mirrors the current backend models (Python / FastAPI). Fields that may be
 * absent in some responses are optional or nullable.
 */

export type SegmentType =
  | "scene_heading"
  | "action"
  | "dialogue"
  | "parenthetical"
  | "camera"
  | "transition";

export interface ScreenplaySegment {
  segment_id: string;
  episode_id: string;
  scene_id?: string | null;
  segment_type: SegmentType;
  /** Character name for dialogue segments. */
  speaker?: string | null;
  /** Original screenplay text. */
  text: string;
  /** Screenplay timestamp in seconds (not a verified video timestamp). */
  start_seconds: number;
  end_seconds?: number | null;
  /** Display form of the screenplay timestamp, e.g. "00:14". */
  timestamp: string;
  line_number?: number | null;
}

export interface Scene {
  scene_id: string;
  heading: string;
  start_seconds?: number | null;
  end_seconds?: number | null;
  segment_ids?: string[];
}

export interface Episode {
  episode_id: string;
  show_id: string;
  episode_number: number;
  filename: string;
  logline?: string | null;
  continuity_notes?: string[] | null;
  scenes?: Scene[] | null;
  segments?: ScreenplaySegment[] | null;
}

export type EpisodeProcessingStatus = "completed" | "processing" | "pending" | "failed";

/**
 * Per-episode processing statistics.
 * PROPOSED shape — aggregate counts the frontend needs for list views.
 * Confirm with the backend before wiring API mode.
 */
export interface EpisodeStats {
  segment_count: number;
  scene_count: number;
  raw_candidate_count: number;
  shortlisted_count: number;
  evaluated_count: number;
  failed_count: number;
  processing_status: EpisodeProcessingStatus;
  processing_error?: string | null;
}

/** Episode row used by the Episodes listing (no scenes/segments payload). */
export type EpisodeListItem = Omit<Episode, "scenes" | "segments"> & {
  stats: EpisodeStats;
};
