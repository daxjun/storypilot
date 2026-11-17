"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, Film, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SortHeader, type SortDir } from "@/components/shared/sort-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/states";
import { EPISODE_STATUS_OPTIONS, EpisodeStatusBadge } from "@/components/shared/status-badge";
import { useAsync } from "@/hooks/use-async";
import { paginate } from "@/lib/filters";
import { getEpisodes } from "@/services/episode-service";

type SortKey = "episode_number" | "raw_candidate_count";
const PAGE_SIZE = 10;

export function EpisodesView() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(getEpisodes);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("episode_number");
  const [dir, setDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().replace(/^ep(isode)?\s*/i, "");
    return (data ?? [])
      .filter((e) => (q ? String(e.episode_number).includes(q) : true))
      .filter((e) => (status === "all" ? true : e.stats.processing_status === status))
      .sort((a, b) => {
        const av = sortKey === "episode_number" ? a.episode_number : a.stats.raw_candidate_count;
        const bv = sortKey === "episode_number" ? b.episode_number : b.stats.raw_candidate_count;
        return dir === "asc" ? av - bv : bv - av;
      });
  }, [data, query, status, sortKey, dir]);

  const { pageItems, page: current, pageCount } = paginate(filtered, page, PAGE_SIZE);
  const hasFilters = query !== "" || status !== "all";

  function onSort(key: SortKey) {
    if (key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir(key === "episode_number" ? "asc" : "desc");
    }
  }

  return (
    <>
      <PageHeader
        title="Episodes"
        description="Screenplays ingested for this show and how far each has moved through the pipeline."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search episode number"
              aria-label="Search by episode number"
              inputMode="numeric"
              className="pl-8"
            />
          </div>
          <NativeSelect
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by processing status"
            className="sm:w-44"
          >
            <option value="all">All statuses</option>
            {EPISODE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} className="m-4" title="Couldn't load episodes" />
        ) : loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Film}
            title={hasFilters ? "No episodes match your filters" : "No episodes yet"}
            description={
              hasFilters
                ? "Try a different episode number or status."
                : "Episodes appear here once screenplays are ingested by the backend."
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortHeader label="Episode" sortKey="episode_number" current={sortKey} dir={dir} onSort={onSort} />
                  <TableHead className="min-w-[280px]">Logline</TableHead>
                  <TableHead className="text-right">Segments</TableHead>
                  <SortHeader
                    label="Raw candidates"
                    sortKey="raw_candidate_count"
                    current={sortKey}
                    dir={dir}
                    onSort={onSort}
                    className="text-right"
                  />
                  <TableHead className="text-right">Shortlisted</TableHead>
                  <TableHead className="text-right">Evaluated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((e) => (
                  <TableRow
                    key={e.episode_id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/episodes/${e.episode_id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/episodes/${e.episode_id}`}
                        className="hover:text-primary"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        Episode {e.episode_number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">
                      <span className="line-clamp-2">{e.logline ?? "—"}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{e.stats.segment_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.stats.raw_candidate_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.stats.shortlisted_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.stats.evaluated_count}</TableCell>
                    <TableCell>
                      <EpisodeStatusBadge status={e.stats.processing_status} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={current}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
