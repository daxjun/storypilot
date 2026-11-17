/** DEMO DATA — recent pipeline activity. */
import type { ActivityEvent } from "@/types/api";

export const mockActivity: ActivityEvent[] = [
  {
    id: "act_09",
    type: "episode_failed",
    message: "Episode 6 failed screenplay parsing",
    timestamp: "2026-11-16T10:05:00Z",
    episode_id: "ep_006",
  },
  {
    id: "act_08",
    type: "candidates_generated",
    message: "4 candidates generated for Episode 5",
    timestamp: "2026-11-16T10:02:00Z",
    episode_id: "ep_005",
  },
  {
    id: "act_07",
    type: "evaluation_completed",
    message: "Editorial evaluation completed for cand_004_02",
    timestamp: "2026-11-16T10:03:00Z",
    candidate_id: "cand_004_02",
  },
  {
    id: "act_06",
    type: "evaluation_completed",
    message: "Editorial evaluation completed for cand_004_01",
    timestamp: "2026-11-16T10:01:00Z",
    candidate_id: "cand_004_01",
  },
  {
    id: "act_05",
    type: "evaluation_failed",
    message: "Evaluation failed for cand_002_02 (schema validation)",
    timestamp: "2026-11-16T09:50:00Z",
    candidate_id: "cand_002_02",
  },
  {
    id: "act_04",
    type: "evaluation_completed",
    message: "Editorial evaluation completed for cand_002_01",
    timestamp: "2026-11-16T09:48:00Z",
    candidate_id: "cand_002_01",
  },
  {
    id: "act_03",
    type: "episode_processed",
    message: "Episode 4 processed — 18 segments",
    timestamp: "2026-11-16T09:17:00Z",
    episode_id: "ep_004",
  },
];
