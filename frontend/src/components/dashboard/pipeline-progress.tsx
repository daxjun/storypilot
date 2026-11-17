import { Check, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PipelineStage, PipelineStageStatus } from "@/types/api";

const STATUS_LABEL: Record<PipelineStageStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
  failed: "Failed",
};

function StageIcon({ status, index }: { status: PipelineStageStatus; index: number }) {
  const base = "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-medium";
  if (status === "completed")
    return (
      <span className={cn(base, "border-success bg-success text-white")}>
        <Check className="size-3.5" aria-hidden />
      </span>
    );
  if (status === "in_progress")
    return (
      <span className={cn(base, "border-primary bg-accent text-primary")}>
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      </span>
    );
  if (status === "failed")
    return (
      <span className={cn(base, "border-danger bg-danger-soft text-danger")}>
        <X className="size-3.5" aria-hidden />
      </span>
    );
  return <span className={cn(base, "border-border bg-card text-muted-foreground")}>{index + 1}</span>;
}

export function PipelineProgress({ stages }: { stages: PipelineStage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project status</CardTitle>
        <CardDescription>Where the current batch is in the StoryPilot pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-4 md:grid-cols-5 md:gap-2">
          {stages.map((stage, i) => (
            <li key={stage.key} className="relative flex gap-3 md:flex-col md:gap-2">
              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-7 left-3.5 h-[calc(100%-4px)] w-px md:top-3.5 md:left-7 md:h-px md:w-[calc(100%-1.25rem)]",
                    stage.status === "completed" ? "bg-success/50" : "bg-border",
                  )}
                />
              )}
              <StageIcon status={stage.status} index={i} />
              <div className="min-w-0 md:pr-3">
                <p className="text-sm font-medium leading-tight">{stage.label}</p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    stage.status === "completed" && "text-success",
                    stage.status === "in_progress" && "text-primary",
                    stage.status === "failed" && "text-danger",
                    stage.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {STATUS_LABEL[stage.status]}
                </p>
                {stage.detail && (
                  <p className="mt-1 text-xs text-muted-foreground">{stage.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
