"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditorialScore } from "@/components/shared/score";
import { SortHeader, type SortDir } from "@/components/shared/sort-header";
import { CandidateStatusBadge } from "@/components/shared/status-badge";
import { formatDuration, formatPreliminary } from "@/lib/format";
import type { CandidateListItem } from "@/types/candidate";

export type CandidateSortKey = "preliminary_score" | "final_editorial_score" | "start_seconds";

export function CandidateTable({
  candidates,
  showEpisode = true,
  sort,
}: {
  candidates: CandidateListItem[];
  showEpisode?: boolean;
  sort?: { key: CandidateSortKey; dir: SortDir; onSort: (key: CandidateSortKey) => void };
}) {
  const router = useRouter();
  const scoreHead = (label: string, key: CandidateSortKey) =>
    sort ? (
      <SortHeader
        label={label}
        sortKey={key}
        current={sort.key}
        dir={sort.dir}
        onSort={sort.onSort}
        className="text-right"
      />
    ) : (
      <TableHead className="text-right">{label}</TableHead>
    );

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Candidate ID</TableHead>
          {showEpisode && <TableHead>Episode</TableHead>}
          <TableHead>Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          {scoreHead("Preliminary", "preliminary_score")}
          {scoreHead("Editorial", "final_editorial_score")}
          <TableHead>Status</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((c) => (
          <TableRow
            key={c.candidate_id}
            className="cursor-pointer"
            onClick={() => router.push(`/candidates/${c.candidate_id}`)}
          >
            <TableCell className="font-mono text-[13px] font-medium">
              <Link
                href={`/candidates/${c.candidate_id}`}
                className="hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                {c.candidate_id}
              </Link>
            </TableCell>
            {showEpisode && <TableCell className="text-muted-foreground">Ep {c.episode_number}</TableCell>}
            <TableCell className="font-mono text-[13px] tabular-nums">{c.start_time}</TableCell>
            <TableCell className="font-mono text-[13px] tabular-nums">{c.end_time}</TableCell>
            <TableCell className="text-right tabular-nums">{formatDuration(c.duration_seconds)}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatPreliminary(c.preliminary_score)}
            </TableCell>
            <TableCell className="text-right">
              <EditorialScore score={c.final_editorial_score} />
            </TableCell>
            <TableCell>
              <CandidateStatusBadge status={c.status} />
            </TableCell>
            <TableCell>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
