/**
 * Mock backend.
 *
 * Builds service responses from the demo data in src/data. It only joins and
 * counts existing records — it never generates scores or evaluations.
 * Delete this file (and src/data) once the real backend is wired up.
 */
import { mockActivity } from "@/data/mock-activity";
import { mockCandidates, mockShortlistedIds } from "@/data/mock-candidates";
import { mockEpisodeProcessing, mockEpisodes } from "@/data/mock-episodes";
import { mockEvaluations } from "@/data/mock-evaluations";
import type {
  CandidateDetail,
  DashboardStats,
  EditorialRankings,
  EpisodeDetail,
  EpisodeListItem,
  EvaluationStatusSummary,
  PipelineStage,
} from "@/types/api";
import type { CandidateListItem, CandidateStatus } from "@/types/candidate";
import type { EpisodeStats } from "@/types/episode";
import { NotFoundError } from "./api";

const LATENCY_MS = 250;
const delay = <T,>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), LATENCY_MS));

function evaluationFor(candidateId: string) {
  return mockEvaluations.find((e) => e.candidate_id === candidateId) ?? null;
}

function statusFor(candidateId: string): CandidateStatus {
  const ev = evaluationFor(candidateId);
  if (ev?.evaluation_status === "completed") return "evaluated";
  if (ev?.evaluation_status === "failed") return "failed";
  if (mockShortlistedIds.has(candidateId)) return "shortlisted";
  return "pending";
}

function toListItems(): CandidateListItem[] {
  return mockCandidates.map((c) => {
    const ev = evaluationFor(c.candidate_id);
    const status = statusFor(c.candidate_id);
    return {
      ...c,
      episode_number:
        mockEpisodes.find((e) => e.episode_id === c.episode_id)?.episode_number ?? 0,
      status,
      final_editorial_score: status === "evaluated" ? (ev?.final_editorial_score ?? null) : null,
    };
  });
}

function statsFor(episodeId: string): EpisodeStats {
  const ep = mockEpisodes.find((e) => e.episode_id === episodeId);
  const proc = mockEpisodeProcessing[episodeId];
  const items = toListItems().filter((c) => c.episode_id === episodeId);
  return {
    segment_count: ep?.segments?.length ?? 0,
    scene_count: ep?.scenes?.length ?? 0,
    raw_candidate_count: proc?.raw_candidates ?? items.length,
    shortlisted_count: items.filter((c) => c.status !== "pending").length,
    evaluated_count: items.filter((c) => c.status === "evaluated").length,
    failed_count: items.filter((c) => c.status === "failed").length,
    processing_status: proc?.status ?? "pending",
    processing_error: proc?.error ?? null,
  };
}

export async function mockGetEpisodes(): Promise<EpisodeListItem[]> {
  return delay(
    mockEpisodes.map((e) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { scenes, segments, ...rest } = e;
      return { ...rest, stats: statsFor(e.episode_id) };
    }),
  );
}

export async function mockGetEpisodeById(episodeId: string): Promise<EpisodeDetail> {
  const ep = mockEpisodes.find((e) => e.episode_id === episodeId);
  if (!ep) throw new NotFoundError(`Episode ${episodeId} not found`);
  return delay({
    ...ep,
    stats: statsFor(episodeId),
    candidates: toListItems().filter((c) => c.episode_id === episodeId),
  });
}

export async function mockGetCandidates(): Promise<CandidateListItem[]> {
  return delay(toListItems());
}

export async function mockGetCandidateById(candidateId: string): Promise<CandidateDetail> {
  const candidate = toListItems().find((c) => c.candidate_id === candidateId);
  if (!candidate) throw new NotFoundError(`Candidate ${candidateId} not found`);
  const ep = mockEpisodes.find((e) => e.episode_id === candidate.episode_id)!;
  const segments = (ep.segments ?? []).filter((s) => candidate.segment_ids.includes(s.segment_id));
  const evaluation = mockShortlistedIds.has(candidateId) ? evaluationFor(candidateId) : null;
  return delay({
    candidate,
    episode: {
      episode_id: ep.episode_id,
      episode_number: ep.episode_number,
      logline: ep.logline,
      show_id: ep.show_id,
    },
    segments,
    evaluation,
  });
}

export async function mockGetEditorialRankings(): Promise<EditorialRankings> {
  const items = toListItems();
  const ranked = items
    .filter((c) => c.status === "evaluated" && typeof c.final_editorial_score === "number")
    .sort(
      (a, b) =>
        (b.final_editorial_score ?? 0) - (a.final_editorial_score ?? 0) ||
        a.candidate_id.localeCompare(b.candidate_id),
    )
    .map((candidate, i) => {
      const ev = evaluationFor(candidate.candidate_id);
      return {
        rank: i + 1,
        candidate,
        hook: ev?.hook ?? null,
        cliffhanger: ev?.cliffhanger ?? null,
        final_editorial_score: candidate.final_editorial_score as number,
      };
    });
  return delay({ ranked, excluded: items.filter((c) => c.status !== "evaluated") });
}

export async function mockGetEvaluationStatus(): Promise<EvaluationStatusSummary> {
  const rows = mockEvaluations.map((ev) => ({
    candidate_id: ev.candidate_id,
    episode_id: ev.episode_id,
    episode_number:
      mockEpisodes.find((e) => e.episode_id === ev.episode_id)?.episode_number ?? 0,
    status: ev.evaluation_status,
    final_editorial_score: ev.final_editorial_score ?? null,
    error_message: ev.error_message ?? null,
    updated_at: ev.evaluated_at ?? null,
  }));
  return delay({
    total_selected: rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    failed: rows.filter((r) => r.status === "failed").length,
    pending: rows.filter((r) => r.status === "pending").length,
    rows,
  });
}

export async function mockGetDashboardStats(): Promise<DashboardStats> {
  const items = toListItems();
  const processed = mockEpisodes.filter(
    (e) => mockEpisodeProcessing[e.episode_id]?.status !== "failed",
  );
  const completedEvals = mockEvaluations.filter((e) => e.evaluation_status === "completed");
  const failedEvals = mockEvaluations.filter((e) => e.evaluation_status === "failed");
  const pendingEvals = mockEvaluations.filter((e) => e.evaluation_status === "pending");
  const failedEpisodes = mockEpisodes.length - processed.length;

  const pipeline: PipelineStage[] = [
    {
      key: "ingestion",
      label: "Screenplay Ingestion",
      status: "completed",
      detail: `${processed.length} of ${mockEpisodes.length} episodes parsed${failedEpisodes ? ` · ${failedEpisodes} failed` : ""}`,
    },
    {
      key: "generation",
      label: "Candidate Generation",
      status: "completed",
      detail: `${Object.values(mockEpisodeProcessing).reduce((n, p) => n + p.raw_candidates, 0)} raw candidates`,
    },
    {
      key: "deduplication",
      label: "Deduplication",
      status: "completed",
      detail: `${items.length} kept · ${mockShortlistedIds.size} shortlisted`,
    },
    {
      key: "evaluation",
      label: "AI Evaluation",
      status: pendingEvals.length > 0 ? "in_progress" : "completed",
      detail: `${completedEvals.length + failedEvals.length} of ${mockEvaluations.length} processed`,
    },
    {
      key: "ranking",
      label: "Editorial Ranking",
      status: pendingEvals.length > 0 ? "pending" : "completed",
      detail:
        pendingEvals.length > 0
          ? `Waiting on ${pendingEvals.length} evaluations · ${completedEvals.length} ranked so far`
          : `${completedEvals.length} ranked`,
    },
  ];

  return delay({
    episodes_processed: processed.length,
    episodes_total: mockEpisodes.length,
    total_segments: mockEpisodes.reduce((n, e) => n + (e.segments?.length ?? 0), 0),
    candidates_generated: Object.values(mockEpisodeProcessing).reduce(
      (n, p) => n + p.raw_candidates,
      0,
    ),
    shortlisted_candidates: mockShortlistedIds.size,
    evaluations_completed: completedEvals.length,
    evaluation_failures: failedEvals.length,
    pipeline,
    candidates_per_episode: mockEpisodes
      .filter((e) => mockEpisodeProcessing[e.episode_id]?.status !== "failed")
      .map((e) => ({
        episode_id: e.episode_id,
        episode_number: e.episode_number,
        candidates: mockEpisodeProcessing[e.episode_id]?.raw_candidates ?? 0,
      })),
    final_scores: completedEvals
      .map((e) => e.final_editorial_score)
      .filter((s): s is number => typeof s === "number"),
    recent_activity: [...mockActivity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  });
}
