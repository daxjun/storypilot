import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EditorialScore } from "@/components/shared/score";
import { CandidateStatusBadge } from "@/components/shared/status-badge";
import { formatDuration, formatPreliminary } from "@/lib/format";
import type { CandidateListItem } from "@/types/candidate";

export function CandidateCards({ candidates }: { candidates: CandidateListItem[] }) {
  return (
    <ul className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {candidates.map((c) => (
        <li key={c.candidate_id}>
          <Link
            href={`/candidates/${c.candidate_id}`}
            className="block rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Card className="h-full p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[13px] font-medium">{c.candidate_id}</p>
                  <p className="text-xs text-muted-foreground">Episode {c.episode_number}</p>
                </div>
                <CandidateStatusBadge status={c.status} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Window</dt>
                  <dd className="mt-0.5 font-mono tabular-nums">
                    {c.start_time}–{c.end_time}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="mt-0.5 tabular-nums">{formatDuration(c.duration_seconds)}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-muted-foreground">Editorial</dt>
                  <dd className="mt-0.5 text-sm">
                    <EditorialScore score={c.final_editorial_score} />
                  </dd>
                </div>
              </dl>
              <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                Preliminary score{" "}
                <span className="tabular-nums text-foreground">{formatPreliminary(c.preliminary_score)}</span>
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
