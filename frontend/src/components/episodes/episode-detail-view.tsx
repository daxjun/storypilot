"use client";

import Link from "next/link";
import { ArrowLeft, Clapperboard, FileText, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/states";
import { EpisodeStatusBadge } from "@/components/shared/status-badge";
import { useAsync } from "@/hooks/use-async";
import { NotFoundError } from "@/services/api";
import { getEpisodeById } from "@/services/episode-service";

function BackLink() {
  return (
    <Link
      href="/episodes"
      className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden /> All episodes
    </Link>
  );
}

export function EpisodeDetailView({ episodeId }: { episodeId: string }) {
  const { data, error, loading, reload } = useAsync(() => getEpisodeById(episodeId), [episodeId]);

  if (error) {
    return (
      <>
        <BackLink />
        {error instanceof NotFoundError ? (
          <EmptyState
            icon={FileText}
            title="Episode not found"
            description={`No episode with ID “${episodeId}”.`}
          />
        ) : (
          <ErrorState error={error} onRetry={reload} title="Couldn't load this episode" />
        )}
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        <BackLink />
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="mb-6 h-4 w-96 max-w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-lg lg:col-span-2" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <Card className="mt-6 overflow-hidden">
          <TableSkeleton rows={3} cols={7} />
        </Card>
      </>
    );
  }

  const s = data.stats;
  const stats = [
    { label: "Scenes", value: s.scene_count },
    { label: "Screenplay segments", value: s.segment_count },
    { label: "Raw candidates", value: s.raw_candidate_count },
    { label: "Kept after dedup", value: data.candidates.length },
    { label: "Shortlisted", value: s.shortlisted_count },
    { label: "Evaluated", value: s.evaluated_count },
  ];

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Episode {data.episode_number}
            <EpisodeStatusBadge status={s.processing_status} />
          </span>
        }
        description={data.logline ?? undefined}
      >
        <BackLink />
      </PageHeader>

      {s.processing_error && (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-lg border border-danger/20 bg-danger-soft/60 p-4 text-sm"
        >
          <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-medium">Processing failed</p>
            <p className="mt-0.5 text-muted-foreground">{s.processing_error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Continuity notes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.continuity_notes && data.continuity_notes.length > 0 ? (
              <ul className="flex flex-col gap-2 text-sm">
                {data.continuity_notes.map((n, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No continuity notes for this episode.</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Source file <span className="font-mono">{data.filename}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {stats.map((st) => (
                <div key={st.label}>
                  <dt className="text-xs text-muted-foreground">{st.label}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{st.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle>Candidate clips</CardTitle>
        </CardHeader>
        {data.candidates.length === 0 ? (
          <EmptyState
            icon={Clapperboard}
            title="No candidates for this episode"
            description={
              s.processing_status === "failed"
                ? "Candidates can't be generated until the screenplay is parsed successfully."
                : "Candidates will appear here once generation finishes."
            }
          />
        ) : (
          <CandidateTable candidates={data.candidates} showEpisode={false} />
        )}
      </Card>
    </>
  );
}
