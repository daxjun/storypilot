import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditorialScore, ScoreBar } from "@/components/shared/score";
import { formatScore } from "@/lib/format";
import { EDITORIAL_DIMENSIONS, formatWeight } from "@/lib/scoring";
import type { EditorialEvaluation } from "@/types/evaluation";

export function EvidenceChip({ id }: { id: string }) {
  return (
    <a
      href={`#evidence-${id}`}
      className="inline-flex items-center rounded border bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
      title={`Jump to screenplay segment ${id}`}
    >
      {id}
    </a>
  );
}

export function EditorialScoring({ evaluation }: { evaluation: EditorialEvaluation }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Editorial scoring</CardTitle>
          <CardDescription className="mt-1">Five weighted dimensions, each scored out of 10.</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Final score</p>
          <p className="text-xl font-semibold tracking-tight">
            <EditorialScore score={evaluation.final_editorial_score} showScale />
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {EDITORIAL_DIMENSIONS.map((dim) => {
            const d = evaluation[dim.key];
            return (
              <li key={dim.key} className="py-4 first:pt-1 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">
                    {dim.label}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      weight {formatWeight(dim.weight)}
                    </span>
                  </p>
                  <p className="text-sm tabular-nums">
                    {d ? (
                      <>
                        <span className="font-semibold">{formatScore(d.score, 0)}</span>
                        <span className="text-muted-foreground"> / 10</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not scored</span>
                    )}
                  </p>
                </div>
                {d && (
                  <>
                    <ScoreBar
                      score={d.score}
                      className="mt-2"
                    />
                    <span className="sr-only">
                      {dim.label}: {d.score} out of 10
                    </span>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{d.rationale}</p>
                    {d.evidence_segment_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Evidence</span>
                        {d.evidence_segment_ids.map((id) => (
                          <EvidenceChip key={id} id={id} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
