"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Info, ListChecks, RotateCw, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EditorialScore } from "@/components/shared/score";
import { StatCard } from "@/components/shared/stat-card";
import { CardsSkeleton, EmptyState, ErrorState, TableSkeleton } from "@/components/shared/states";
import { EvaluationStatusBadge } from "@/components/shared/status-badge";
import { useAsync } from "@/hooks/use-async";
import { FEATURES, isMockMode } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { getEvaluationStatus, retryEvaluation } from "@/services/evaluation-service";

const retryAvailable = FEATURES.retryEvaluation && !isMockMode;

export function EvaluationsView() {
  const { data, error, loading, reload } = useAsync(getEvaluationStatus);
  const [status, setStatus] = useState("all");
  const [retrying, setRetrying] = useState<string | null>(null);

  
const rows = useMemo(
  () =>
    (data?.rows ?? [])
      .filter((r) => (status === "all" ? true : r.status === status))
      .sort((a, b) => {
        const order = { completed: 0, failed: 1, pending: 2 } as const;

        // Show evaluated candidates first, with the highest score at the top.
        if (a.status === "completed" && b.status === "completed") {
          const scoreA = a.final_editorial_score ?? -Infinity;
          const scoreB = b.final_editorial_score ?? -Infinity;
          return scoreB - scoreA;
        }

        return (
          order[a.status] - order[b.status] ||
          a.candidate_id.localeCompare(b.candidate_id)
        );
      }),
  [data, status],
);


  async function onRetry(candidateId: string) {
    setRetrying(candidateId);
    try {
      await retryEvaluation(candidateId);
      toast.success(`Re-queued ${candidateId} for evaluation`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setRetrying(null);
    }
  }

  const processed = data ? data.completed + data.failed : 0;
  const pct = data && data.total_selected ? (processed / data.total_selected) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Evaluations"
        description="Progress of the AI editorial evaluator across shortlisted candidates."
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} title="Couldn't load evaluation status" />
      ) : loading || !data ? (
        <div className="flex flex-col gap-6">
          <CardsSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" />
          <Card className="overflow-hidden">
            <TableSkeleton rows={5} cols={5} />
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-label="Evaluation totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Selected for evaluation" value={data.total_selected} icon={ListChecks} />
            <StatCard label="Successfully evaluated" value={data.completed} icon={CheckCircle2} tone="success" />
            <StatCard
              label="Failed"
              value={data.failed}
              icon={XCircle}
              tone={data.failed > 0 ? "danger" : "default"}
            />
            <StatCard label="Awaiting evaluation" value={data.pending} icon={Clock} />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Overall progress</CardTitle>
              <CardDescription>
                {processed} of {data.total_selected} shortlisted candidates processed
                {data.pending > 0 ? ` · ${data.pending} still awaiting a result` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                aria-label="Evaluation progress"
              >
                {data.completed > 0 && (
                  <div
                    className="h-full rounded-l-full bg-success"
                    style={{ width: `${(data.completed / data.total_selected) * 100}%` }}
                  />
                )}
                {data.failed > 0 && (
                  <div
                    className="h-full bg-danger"
                    style={{ width: `${(data.failed / data.total_selected) * 100}%` }}
                  />
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" aria-hidden /> Evaluated {data.completed}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-danger" aria-hidden /> Failed {data.failed}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-muted-foreground/30" aria-hidden /> Awaiting{" "}
                  {data.pending}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by evaluation status"
                className="sm:w-48"
              >
                <option value="all">All statuses</option>
                <option value="completed">Evaluated</option>
                <option value="failed">Failed</option>
                <option value="pending">Awaiting</option>
              </NativeSelect>
              {!retryAvailable && data.failed > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  Retrying failed evaluations isn&apos;t available yet — it needs a backend retry endpoint.
                </p>
              )}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={data.rows.length === 0 ? "Nothing selected for evaluation yet" : "No evaluations with this status"}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Candidate ID</TableHead>
                    <TableHead>Episode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Editorial score</TableHead>
                    <TableHead className="min-w-[260px]">Error</TableHead>
                    <TableHead>Updated</TableHead>
                    {retryAvailable && (
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.candidate_id}>
                      <TableCell className="font-mono text-[13px] font-medium">
                        <Link href={`/candidates/${r.candidate_id}`} className="hover:text-primary">
                          {r.candidate_id}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">Ep {r.episode_number}</TableCell>
                      <TableCell>
                        <EvaluationStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <EditorialScore
			  score={
    		          r.status === "completed"
    			  ? r.final_editorial_score
      		          : null
  			  }
			  />
                      </TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal text-[13px] text-danger">
                        {r.error_message ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {r.status === "pending" ? "—" : formatDateTime(r.updated_at)}
                      </TableCell>
                      {retryAvailable && (
                        <TableCell>
                          {r.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRetry(r.candidate_id)}
                              disabled={retrying === r.candidate_id}
                            >
                              <RotateCw className={retrying === r.candidate_id ? "animate-spin" : ""} />
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
