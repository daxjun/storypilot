"use client";

import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { getEvaluationStatus } from "@/services/evaluation-service";
import { cn } from "@/lib/utils";

/** Compact evaluation progress pill for the top bar. Links to /evaluations. */
export function EvaluationIndicator() {
  const { data, error } = useAsync(getEvaluationStatus);

  if (error) {
    return (
      <Link
        href="/evaluations"
        className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        title={error.message}
      >
        <span className="size-1.5 rounded-full bg-danger" aria-hidden />
        <span className="hidden sm:inline">Status unavailable</span>
      </Link>
    );
  }

  if (!data) {
    return <span className="h-7 w-24 animate-pulse rounded-md bg-muted" aria-hidden />;
  }

  const done = data.completed + data.failed;
  const running = data.pending > 0;
  const label = running ? "Evaluating" : data.failed > 0 ? "Done with errors" : "Evaluated";

  return (
    <Link
      href="/evaluations"
      className="inline-flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted"
      aria-label={`AI evaluation: ${done} of ${data.total_selected} processed. ${label}.`}
    >
      <span className="relative flex size-2" aria-hidden>
        {running && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            running ? "bg-primary" : data.failed > 0 ? "bg-warning" : "bg-success",
          )}
        />
      </span>
      <span className="hidden text-muted-foreground sm:inline">{label}</span>
      <span className="font-medium tabular-nums">
        {done}/{data.total_selected}
      </span>
    </Link>
  );
}
