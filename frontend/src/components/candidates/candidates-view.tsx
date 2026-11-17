"use client";

import { useMemo, useState } from "react";
import { Clapperboard, LayoutGrid, Rows3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import type { SortDir } from "@/components/shared/sort-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/shared/states";
import { CANDIDATE_STATUS_OPTIONS } from "@/components/shared/status-badge";
import { useAsync } from "@/hooks/use-async";
import { DURATION_BUCKETS, matchesDuration, paginate } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { getCandidates } from "@/services/candidate-service";
import { CandidateCards } from "./candidate-cards";
import { CandidateTable, type CandidateSortKey } from "./candidate-table";

const PAGE_SIZE = 12;

export function CandidatesView({
  initialQuery = "",
  initialEpisode = "all",
}: {
  initialQuery?: string;
  initialEpisode?: string;
}) {
  const { data, error, loading, reload } = useAsync(getCandidates);
  const [query, setQuery] = useState(initialQuery);
  const [episode, setEpisode] = useState(initialEpisode);
  const [status, setStatus] = useState("all");
  const [duration, setDuration] = useState("all");
  const [sortKey, setSortKey] = useState<CandidateSortKey>("preliminary_score");
  const [dir, setDir] = useState<SortDir>("desc");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);

  const episodes = useMemo(
    () => [...new Set((data ?? []).map((c) => c.episode_number))].sort((a, b) => a - b),
    [data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (data ?? [])
      .filter((c) => (q ? c.candidate_id.toLowerCase().includes(q) : true))
      .filter((c) => (episode === "all" ? true : String(c.episode_number) === episode))
      .filter((c) => (status === "all" ? true : c.status === status))
      .filter((c) => matchesDuration(c.duration_seconds, duration));
    return rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Candidates without an editorial score always sort last.
      if (av == null && bv == null) return a.candidate_id.localeCompare(b.candidate_id);
      if (av == null) return 1;
      if (bv == null) return -1;
      return dir === "asc" ? av - bv : bv - av;
    });
  }, [data, query, episode, status, duration, sortKey, dir]);

  const hasFilters = query !== "" || episode !== "all" || status !== "all" || duration !== "all";
  const { pageItems, page: current, pageCount } = paginate(filtered, page, PAGE_SIZE);

  function update<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  function onSort(key: CandidateSortKey) {
    if (key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("desc");
    }
  }

  function clearFilters() {
    setQuery("");
    setEpisode("all");
    setStatus("all");
    setDuration("all");
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Clip Candidates"
        description="Promotional clip windows generated from screenplay timestamps. Open a candidate to see its editorial evaluation."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b p-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative lg:w-56">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => update(setQuery)(e.target.value)}
              placeholder="Search candidate ID"
              aria-label="Search by candidate ID"
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <NativeSelect
              value={episode}
              onChange={(e) => update(setEpisode)(e.target.value)}
              aria-label="Filter by episode"
              className="lg:w-36"
            >
              <option value="all">All episodes</option>
              {episodes.map((n) => (
                <option key={n} value={String(n)}>
                  Episode {n}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={status}
              onChange={(e) => update(setStatus)(e.target.value)}
              aria-label="Filter by evaluation status"
              className="lg:w-36"
            >
              <option value="all">All statuses</option>
              {CANDIDATE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} title={o.hint}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={duration}
              onChange={(e) => update(setDuration)(e.target.value)}
              aria-label="Filter by duration"
              className="lg:w-36"
            >
              {DURATION_BUCKETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={`${sortKey}:${dir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(":") as [CandidateSortKey, SortDir];
                setSortKey(k);
                setDir(d);
              }}
              aria-label="Sort candidates"
              className="lg:w-48"
            >
              <option value="preliminary_score:desc">Preliminary score ↓</option>
              <option value="preliminary_score:asc">Preliminary score ↑</option>
              <option value="final_editorial_score:desc">Editorial score ↓</option>
              <option value="final_editorial_score:asc">Editorial score ↑</option>
            </NativeSelect>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start lg:self-auto">
              Clear filters
            </Button>
          )}
          <div
            className="ml-auto hidden items-center rounded-md border p-0.5 sm:flex"
            role="group"
            aria-label="View mode"
          >
            {(
              [
                { v: "table", icon: Rows3, label: "Table view" },
                { v: "cards", icon: LayoutGrid, label: "Card view" },
              ] as const
            ).map(({ v, icon: Icon, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                aria-label={label}
                title={label}
                className={cn(
                  "rounded p-1.5 text-muted-foreground hover:text-foreground",
                  view === v && "bg-muted text-foreground",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={reload} className="m-4" title="Couldn't load candidates" />
        ) : loading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Clapperboard}
            title={hasFilters ? "No candidates match your filters" : "No candidates yet"}
            description={
              hasFilters
                ? "Try widening the filters or clearing them."
                : "Candidates appear here after screenplays are processed."
            }
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {view === "table" ? (
              <CandidateTable candidates={pageItems} sort={{ key: sortKey, dir, onSort }} />
            ) : (
              <CandidateCards candidates={pageItems} />
            )}
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
      <p className="mt-3 text-xs text-muted-foreground">
        Start, end and duration come from screenplay timestamps and are not verified video timings.
      </p>
    </>
  );
}
