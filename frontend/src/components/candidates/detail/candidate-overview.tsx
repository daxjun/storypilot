"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { EditorialScore } from "@/components/shared/score";
import { formatDuration, formatPreliminary, humanizeKey } from "@/lib/format";
import type { CandidateDetail } from "@/types/api";

export function CandidateOverview({ detail }: { detail: CandidateDetail }) {
  const { candidate: c, episode, evaluation } = detail;
  const finalScore =
    evaluation?.evaluation_status === "completed" ? evaluation.final_editorial_score : null;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(c.candidate_id);
      toast.success("Candidate ID copied");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  const items = [
    {
      label: "Episode",
      value: (
        <Link href={`/episodes/${episode.episode_id}`} className="hover:text-primary">
          Episode {episode.episode_number}
        </Link>
      ),
    },
    { label: "Start", value: <span className="font-mono">{c.start_time}</span> },
    { label: "End", value: <span className="font-mono">{c.end_time}</span> },
    { label: "Duration", value: formatDuration(c.duration_seconds) },
    { label: "Preliminary score", value: formatPreliminary(c.preliminary_score) },
  ];

  const signals = Object.entries(c.signals ?? {});

  return (
    <Card>
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-stretch">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Candidate</span>
            <span className="font-mono text-sm font-medium">{c.candidate_id}</span>
            <button
              type="button"
              onClick={copyId}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Copy candidate ID"
              title="Copy candidate ID"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
            {items.map((it) => (
              <div key={it.label}>
                <dt className="text-xs text-muted-foreground">{it.label}</dt>
                <dd className="mt-0.5 text-sm font-medium tabular-nums">{it.value}</dd>
              </div>
            ))}
          </dl>
          {signals.length > 0 && (
            <details className="group mt-4 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Candidate generation signals
              </summary>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
                {signals.map(([k, v]) => (
                  <div key={k} className="flex gap-1.5">
                    <dt className="text-muted-foreground">{humanizeKey(k)}:</dt>
                    <dd className="font-medium tabular-nums">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
        <div className="flex flex-col justify-center rounded-md bg-muted/60 px-5 py-4 md:w-52">
          <p className="text-xs text-muted-foreground">Final editorial score</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            <EditorialScore score={finalScore} showScale />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {finalScore != null ? "Weighted across 5 dimensions" : "Not evaluated"}
          </p>
        </div>
      </div>
    </Card>
  );
}
