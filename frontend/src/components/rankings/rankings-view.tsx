"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { PageHeader } from "@/components/shared/page-header";
import { EditorialScore } from "@/components/shared/score";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/states";
import { CandidateStatusBadge } from "@/components/shared/status-badge";
import { useAsync } from "@/hooks/use-async";
import { DURATION_BUCKETS, matchesDuration } from "@/lib/filters";
import { formatDuration } from "@/lib/format";
import { getEditorialRankings } from "@/services/evaluation-service";
import type { RankingEntry } from "@/types/api";
import { RankingMethodology } from "./ranking-methodology";

const STATUS_OPTIONS = [
  { value: "evaluated", label: "Evaluated (ranked)" },
  { value: "failed", label: "Failed — not ranked" },
  { value: "shortlisted", label: "Awaiting evaluation — not ranked" },
  { value: "pending", label: "Not shortlisted — not ranked" },
];

const MIN_SCORES = [
  { value: "0", label: "Any score" },
  { value: "6", label: "6.0 and above" },
  { value: "7", label: "7.0 and above" },
  { value: "8", label: "8.0 and above" },
  { value: "9", label: "9.0 and above" },
];

function RankCell({ rank }: { rank: number }) {
  return (
    <span
      className={
        rank <= 3
          ? "inline-grid size-7 place-items-center rounded-md bg-accent text-[13px] font-semibold text-accent-foreground tabular-nums"
          : "inline-grid size-7 place-items-center rounded-md text-[13px] text-muted-foreground tabular-nums"
      }
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

function RankedMobileList({ entries }: { entries: RankingEntry[] }) {
  return (
    <ul className="divide-y md:hidden">
      {entries.map((r) => (
        <li key={r.candidate.candidate_id}>
          <Link
            href={`/candidates/${r.candidate.candidate_id}`}
            className="flex gap-3 px-4 py-4 hover:bg-muted/40"
          >
            <RankCell rank={r.rank} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-medium">{r.candidate.candidate_id}</span>
                <EditorialScore score={r.final_editorial_score} className="text-base" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Episode {r.candidate.episode_number} · {formatDuration(r.candidate.duration_seconds)}
              </p>
              {r.hook && <p className="mt-2 line-clamp-2 text-[13px]">{r.hook}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RankingsView() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(getEditorialRankings);
  const [episode, setEpisode] = useState("all");
  const [minScore, setMinScore] = useState("0");
  const [duration, setDuration] = useState("all");
  const [status, setStatus] = useState("evaluated");

  const episodes = useMemo(() => {
    const all = [...(data?.ranked.map((r) => r.candidate) ?? []), ...(data?.excluded ?? [])];
    return [...new Set(all.map((c) => c.episode_number))].sort((a, b) => a - b);
  }, [data]);

  const ranked = useMemo(
    () =>
      (data?.ranked ?? [])
        .filter((r) => (episode === "all" ? true : String(r.candidate.episode_number) === episode))
        .filter((r) => r.final_editorial_score >= Number(minScore))
        .filter((r) => matchesDuration(r.candidate.duration_seconds, duration)),
    [data, episode, minScore, duration],
  );

  const excluded = useMemo(
    () =>
      (data?.excluded ?? [])
        .filter((c) => c.status === status)
        .filter((c) => (episode === "all" ? true : String(c.episode_number) === episode))
        .filter((c) => matchesDuration(c.duration_seconds, duration)),
    [data, status, episode, duration],
  );

  const excludedCounts = useMemo(() => {
    const counts = { failed: 0, shortlisted: 0, pending: 0 };
    for (const c of data?.excluded ?? []) {
      if (c.status in counts) counts[c.status as keyof typeof counts] += 1;
    }
    return counts;
  }, [data]);

  const hasFilters = episode !== "all" || minScore !== "0" || duration !== "all" || status !== "evaluated";
  const showingRanked = status === "evaluated";

  return (
    <>
      <PageHeader
        title="Editorial Rankings"
        description="Evaluated clips ordered by final editorial score, to help decide what to publish first."
      />

      <div className="flex flex-col gap-4">
        <RankingMethodology />

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <NativeSelect
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                aria-label="Filter by episode"
                className="sm:w-36"
              >
                <option value="all">All episodes</option>
                {episodes.map((n) => (
                  <option key={n} value={String(n)}>
                    Episode {n}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                aria-label="Minimum editorial score"
                className="sm:w-40"
                disabled={!showingRanked}
              >
                {MIN_SCORES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                aria-label="Filter by duration"
                className="sm:w-36"
              >
                {DURATION_BUCKETS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by evaluation status"
                className="sm:w-64"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start sm:self-auto"
                onClick={() => {
                  setEpisode("all");
                  setMinScore("0");
                  setDuration("all");
                  setStatus("evaluated");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {error ? (
            <ErrorState error={error} onRetry={reload} className="m-4" title="Couldn't load rankings" />
          ) : loading || !data ? (
            <TableSkeleton rows={5} cols={7} />
          ) : showingRanked ? (
            ranked.length === 0 ? (
              <EmptyState
                icon={ListOrdered}
                title={data.ranked.length === 0 ? "No ranked clips yet" : "No ranked clips match your filters"}
                description={
                  data.ranked.length === 0
                    ? "Clips are ranked once their AI editorial evaluation completes successfully."
                    : "Try lowering the minimum score or clearing filters."
                }
              />
            ) : (
              <>
                <RankedMobileList entries={ranked} />
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-14">Rank</TableHead>
                        <TableHead>Episode</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead className="min-w-[220px]">Hook</TableHead>
                        <TableHead className="min-w-[220px]">Cliffhanger</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10">
                          <span className="sr-only">Inspect</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranked.map((r) => (
                        <TableRow
                          key={r.candidate.candidate_id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/candidates/${r.candidate.candidate_id}`)}
                        >
                          <TableCell>
                            <RankCell rank={r.rank} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">Ep {r.candidate.episode_number}</TableCell>
                          <TableCell className="font-mono text-[13px] font-medium">
                            <Link
                              href={`/candidates/${r.candidate.candidate_id}`}
                              className="hover:text-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {r.candidate.candidate_id}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-[300px] whitespace-normal text-[13px]">
                            <span className="line-clamp-2" title={r.hook ?? undefined}>
                              {r.hook ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[300px] whitespace-normal text-[13px] text-muted-foreground">
                            <span className="line-clamp-2" title={r.cliffhanger ?? undefined}>
                              {r.cliffhanger ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <EditorialScore score={r.final_editorial_score} className="text-[15px] font-semibold" />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatDuration(r.candidate.duration_seconds)}
                          </TableCell>
                          <TableCell>
                            <CandidateStatusBadge status={r.candidate.status} />
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )
          ) : (
            <>
              <div className="border-b bg-muted/40 px-4 py-2.5 text-[13px] text-muted-foreground">
                These candidates are <strong className="font-medium text-foreground">not ranked</strong>{" "}
                because they don&apos;t have a successful editorial evaluation.
              </div>
              {excluded.length === 0 ? (
                <EmptyState title="No candidates with this status" />
              ) : (
                <CandidateTable candidates={excluded} />
              )}
            </>
          )}
        </Card>

        {data && (excludedCounts.failed + excludedCounts.shortlisted + excludedCounts.pending > 0) && (
          <p className="text-xs text-muted-foreground">
            Not ranked: {excludedCounts.failed} failed, {excludedCounts.shortlisted} awaiting evaluation,{" "}
            {excludedCounts.pending} not shortlisted.{" "}
            <Link href="/evaluations" className="underline-offset-2 hover:text-foreground hover:underline">
              See evaluation status
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
