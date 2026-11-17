
"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clapperboard,
  Film,
  ListChecks,
  ListOrdered,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CardsSkeleton, ErrorState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { getDashboardStats } from "@/services/dashboard-service";
import { getEvaluationStatus } from "@/services/evaluation-service";
import {
  CandidatesByEpisodeChart,
  EvaluationCompletionCard,
  ScoreDistributionChart,
} from "./charts";
import { PipelineProgress } from "./pipeline-progress";
import { RecentActivity } from "./recent-activity";

export function DashboardView() {
  const {
    data,
    error,
    loading,
    reload,
  } = useAsync(getDashboardStats);

  const {
    data: evaluationStatus,
    loading: evaluationLoading,
  } = useAsync(getEvaluationStatus);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of screenplay processing, clip discovery and editorial evaluation."
        actions={
          <Button asChild size="sm">
            <Link href="/rankings">
              <ListOrdered /> View rankings
            </Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={reload}
          title="Couldn't load the dashboard"
        />
      ) : loading || !data ? (
        <div className="flex flex-col gap-6">
          <CardsSkeleton
            count={6}
            className="grid-cols-2 md:grid-cols-3 2xl:grid-cols-6"
          />
          <Skeleton className="h-36 rounded-lg" />
          <CardsSkeleton count={3} className="lg:grid-cols-3 [&>*]:h-72" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section
            aria-label="Key metrics"
            className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6"
          >
            <StatCard
              label="Episodes processed"
              value={data.episodes_processed}
              icon={Film}
              hint={`of ${data.episodes_total} uploaded`}
            />

            <StatCard
              label="Screenplay segments"
              value={data.total_segments}
              icon={ScrollText}
            />

            <StatCard
              label="Candidates generated"
              value={data.candidates_generated}
              icon={Clapperboard}
            />

            <StatCard
              label="Shortlisted"
              value={data.shortlisted_candidates}
              icon={ListChecks}
            />

            <StatCard
              label="Evaluations completed"
              value={data.evaluations_completed}
              icon={CheckCircle2}
              tone="success"
            />

            <StatCard
              label="Evaluation failures"
              value={data.evaluation_failures}
              icon={AlertTriangle}
              tone={data.evaluation_failures > 0 ? "danger" : "default"}
              hint={
                data.evaluation_failures > 0 ? (
                  <Link
                    href="/evaluations"
                    className="underline-offset-2 hover:underline"
                  >
                    Review failures
                  </Link>
                ) : undefined
              }
            />
          </section>

          <PipelineProgress stages={data.pipeline} />

          <section
            aria-label="Overview charts"
            className="grid gap-4 lg:grid-cols-3"
          >
            <CandidatesByEpisodeChart
              data={data.candidates_per_episode}
            />

            <ScoreDistributionChart
              scores={data.final_scores}
            />

            {evaluationLoading || !evaluationStatus ? (
              <Skeleton className="h-72 rounded-lg" />
            ) : (
              <EvaluationCompletionCard
                completed={evaluationStatus.completed}
                failed={evaluationStatus.failed}
                pending={evaluationStatus.pending}
              />
            )}
          </section>

          <RecentActivity events={data.recent_activity} />
        </div>
      )}
    </>
  );
}
