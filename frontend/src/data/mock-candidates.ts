/**
 * DEMO DATA — promotional clip candidates for "Crimson Vows".
 * Timestamps and segment IDs are derived from mock-episodes.ts so that every
 * reference stays consistent.
 */
import type { Candidate, CandidateSignals } from "@/types/candidate";
import { mockEpisodes } from "./mock-episodes";

interface Spec {
  candidate_id: string;
  episode_id: string;
  /** 1-based inclusive segment range within the episode. */
  from: number;
  to: number;
  preliminary_score: number;
  signals: CandidateSignals;
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function build(spec: Spec): Candidate {
  const ep = mockEpisodes.find((e) => e.episode_id === spec.episode_id);
  const segs = (ep?.segments ?? []).slice(spec.from - 1, spec.to);
  if (!ep || segs.length === 0) throw new Error(`Bad mock candidate ${spec.candidate_id}`);
  const start = segs[0].start_seconds;
  const end = segs[segs.length - 1].end_seconds ?? segs[segs.length - 1].start_seconds;
  return {
    candidate_id: spec.candidate_id,
    episode_id: spec.episode_id,
    start_seconds: start,
    end_seconds: end,
    duration_seconds: end - start,
    start_time: fmt(start),
    end_time: fmt(end),
    segment_ids: segs.map((s) => s.segment_id),
    source_line_start: segs[0].line_number ?? null,
    source_line_end: segs[segs.length - 1].line_number ?? null,
    preliminary_score: spec.preliminary_score,
    signals: spec.signals,
  };
}

const specs: Spec[] = [
  {
    candidate_id: "cand_001_01",
    episode_id: "ep_001",
    from: 4,
    to: 10,
    preliminary_score: 0.81,
    signals: { conflict_markers: 4, dialogue_ratio: 0.57, ends_on_reveal: false, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_001_02",
    episode_id: "ep_001",
    from: 13,
    to: 19,
    preliminary_score: 0.86,
    signals: { conflict_markers: 2, dialogue_ratio: 0.43, ends_on_reveal: true, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_001_03",
    episode_id: "ep_001",
    from: 1,
    to: 5,
    preliminary_score: 0.54,
    signals: { conflict_markers: 1, dialogue_ratio: 0.2, ends_on_reveal: false, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_002_01",
    episode_id: "ep_002",
    from: 9,
    to: 13,
    preliminary_score: 0.72,
    signals: { conflict_markers: 2, dialogue_ratio: 0.4, ends_on_reveal: false, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_002_02",
    episode_id: "ep_002",
    from: 14,
    to: 20,
    preliminary_score: 0.77,
    signals: { conflict_markers: 2, dialogue_ratio: 0.29, ends_on_reveal: true, scene_breaks: 1 },
  },
  {
    candidate_id: "cand_003_01",
    episode_id: "ep_003",
    from: 3,
    to: 10,
    preliminary_score: 0.79,
    signals: { conflict_markers: 3, dialogue_ratio: 0.5, ends_on_reveal: true, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_003_02",
    episode_id: "ep_003",
    from: 12,
    to: 16,
    preliminary_score: 0.74,
    signals: { conflict_markers: 2, dialogue_ratio: 0.4, ends_on_reveal: true, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_004_01",
    episode_id: "ep_004",
    from: 4,
    to: 10,
    preliminary_score: 0.91,
    signals: { conflict_markers: 4, dialogue_ratio: 0.43, ends_on_reveal: true, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_004_02",
    episode_id: "ep_004",
    from: 12,
    to: 17,
    preliminary_score: 0.83,
    signals: { conflict_markers: 3, dialogue_ratio: 0.33, ends_on_reveal: true, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_004_03",
    episode_id: "ep_004",
    from: 1,
    to: 3,
    preliminary_score: 0.48,
    signals: { conflict_markers: 0, dialogue_ratio: 0.33, ends_on_reveal: false, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_005_01",
    episode_id: "ep_005",
    from: 5,
    to: 12,
    preliminary_score: 0.8,
    signals: { conflict_markers: 3, dialogue_ratio: 0.38, ends_on_reveal: true, scene_breaks: 0 },
  },
  {
    candidate_id: "cand_005_02",
    episode_id: "ep_005",
    from: 1,
    to: 3,
    preliminary_score: 0.57,
    signals: { conflict_markers: 1, dialogue_ratio: 0.33, ends_on_reveal: true, scene_breaks: 0 },
  },
];

export const mockCandidates: Candidate[] = specs.map(build);

/** Candidate IDs selected for AI evaluation after deduplication. */
export const mockShortlistedIds = new Set<string>([
  "cand_001_01",
  "cand_001_02",
  "cand_002_01",
  "cand_002_02",
  "cand_003_01",
  "cand_003_02",
  "cand_004_01",
  "cand_004_02",
  "cand_005_01",
]);
