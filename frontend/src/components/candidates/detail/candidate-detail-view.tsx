"use client";

import Link from "next/link";
import { ArrowLeft, Clock, FileQuestion, ListChecks, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { CandidateStatusBadge } from "@/components/shared/status-badge";
import { useAsync } from "@/hooks/use-async";
import { cn } from "@/lib/utils";
import { NotFoundError } from "@/services/api";
import { getCandidateById } from "@/services/candidate-service";
import type { CandidateDetail } from "@/types/api";
import { CandidateOverview } from "./candidate-overview";
import { EditorialScoring } from "./editorial-scoring";
import { EvidencePanel } from "./evidence-panel";
import { Findings } from "./findings";
import { PromoContent } from "./promo-content";

function BackLink() {
  return (
    <Link
      href="/candidates"
      className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden /> All candidates
    </Link>
  );
}

function Notice({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "danger" | "info" | "neutral";
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        tone === "danger" && "border-danger/20 bg-danger-soft/60",
        tone === "info" && "border-primary/15 bg-info-soft/60",
        tone === "neutral" && "bg-muted/50",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "danger" ? "text-danger" : tone === "info" ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-0.5 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function StatusNotice({ detail }: { detail: CandidateDetail }) {
  const { candidate, evaluation } = detail;
  if (candidate.status === "failed") {
    return (
      <Notice tone="danger" icon={XCircle} title="AI evaluation failed">
        <p>{evaluation?.error_message ?? "The evaluator did not return a usable result."}</p>
        <p className="mt-1">
          No scores are shown for this candidate.{" "}
          <Link href="/evaluations" className="font-medium text-foreground underline-offset-2 hover:underline">
            View evaluation status
          </Link>
        </p>
      </Notice>
    );
  }
  if (candidate.status === "shortlisted") {
    return (
      <Notice tone="info" icon={ListChecks} title="Awaiting AI evaluation">
        This candidate is shortlisted. Its editorial evaluation will appear here once the evaluator
        returns a result.
      </Notice>
    );
  }
  if (candidate.status === "pending") {
    return (
      <Notice tone="neutral" icon={Clock} title="Not selected for evaluation">
        This candidate was kept after deduplication but has not been shortlisted for AI evaluation.
      </Notice>
    );
  }
  return null;
}

export function CandidateDetailView({ candidateId }: { candidateId: string }) {
  const { data, error, loading, reload } = useAsync(() => getCandidateById(candidateId), [candidateId]);

  if (error) {
    return (
      <>
        <BackLink />
        {error instanceof NotFoundError ? (
          <EmptyState
            icon={FileQuestion}
            title="Candidate not found"
            description={`No candidate with ID “${candidateId}”.`}
          />
        ) : (
          <ErrorState error={error} onRetry={reload} title="Couldn't load this candidate" />
        )}
      </>
    );
  }

  if (loading || !data) {
    return (
      <>
        <BackLink />
        <Skeleton className="mb-6 h-7 w-64" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-36 rounded-lg" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </>
    );
  }

  const { candidate, evaluation, segments } = data;
  const evaluated = candidate.status === "evaluated" && evaluation?.evaluation_status === "completed";

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{candidate.candidate_id}</span>
            <CandidateStatusBadge status={candidate.status} />
          </span>
        }
        description={data.episode.logline ?? undefined}
      >
        <BackLink />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <CandidateOverview detail={data} />
        <StatusNotice detail={data} />

        {evaluated && evaluation && (
          <>
            <PromoContent evaluation={evaluation} />
            <div className="grid items-start gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <EditorialScoring evaluation={evaluation} />
              </div>
              <div className="lg:col-span-2">
                <Findings evaluation={evaluation} />
              </div>
            </div>
          </>
        )}

        <EvidencePanel candidate={candidate} segments={segments} evaluation={evaluated ? evaluation : null} />

        <p className="text-xs text-muted-foreground">
          Timings are screenplay timestamps, not verified video durations.
        </p>
      </div>
    </>
  );
}
