import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EDITORIAL_DIMENSIONS } from "@/lib/scoring";
import { humanizeKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Candidate } from "@/types/candidate";
import type { ScreenplaySegment } from "@/types/episode";
import type { EditorialEvaluation } from "@/types/evaluation";

type Role = "hook" | "cliff" | "cited" | "context";

const ROLE_META: Record<Role, { label: string; color: string; border: string }> = {
  hook: { label: "Opening hook evidence", color: "bg-[var(--role-hook)]", border: "border-l-[var(--role-hook)]" },
  cliff: {
    label: "Cliffhanger evidence",
    color: "bg-[var(--role-cliff)]",
    border: "border-l-[var(--role-cliff)]",
  },
  cited: { label: "Main story · cited", color: "bg-[var(--role-cited)]", border: "border-l-[var(--role-cited)]" },
  context: {
    label: "Main story · not cited",
    color: "bg-[var(--role-context)]",
    border: "border-l-transparent",
  },
};

function classify(evaluation: EditorialEvaluation | null) {
  const hook = new Set(evaluation?.hook_strength?.evidence_segment_ids ?? []);
  const cliff = new Set(evaluation?.cliffhanger_evidence_segment_ids ?? []);
  const citedBy = new Map<string, string[]>();
  if (evaluation) {
    for (const dim of EDITORIAL_DIMENSIONS) {
      for (const id of evaluation[dim.key]?.evidence_segment_ids ?? []) {
        citedBy.set(id, [...(citedBy.get(id) ?? []), dim.label]);
      }
    }
    for (const id of cliff) {
      citedBy.set(id, [...(citedBy.get(id) ?? []), "Cliffhanger"]);
    }
  }
  const roleOf = (id: string): Role =>
    cliff.has(id) ? "cliff" : hook.has(id) ? "hook" : citedBy.has(id) ? "cited" : "context";
  return { roleOf, citedBy };
}

function Timeline({
  candidate,
  segments,
  roleOf,
}: {
  candidate: Candidate;
  segments: ScreenplaySegment[];
  roleOf: (id: string) => Role;
}) {
  const span = Math.max(1, candidate.end_seconds - candidate.start_seconds);
  return (
    <div>
      <div className="relative h-8 w-full overflow-hidden rounded-md bg-muted" role="list" aria-label="Clip timeline">
        {segments.map((s) => {
          const start = Math.max(s.start_seconds, candidate.start_seconds);
          const end = Math.min(s.end_seconds ?? candidate.end_seconds, candidate.end_seconds);
          const left = ((start - candidate.start_seconds) / span) * 100;
          const width = Math.max(0.5, ((end - start) / span) * 100);
          const role = roleOf(s.segment_id);
          return (
            <a
              key={s.segment_id}
              role="listitem"
              href={`#evidence-${s.segment_id}`}
              className={cn(
                "absolute inset-y-0 border-x border-card transition-opacity hover:opacity-80 focus-visible:z-10",
                ROLE_META[role].color,
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${s.segment_id} · ${s.timestamp} · ${ROLE_META[role].label}`}
              aria-label={`${s.segment_id} at ${s.timestamp}, ${ROLE_META[role].label}`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground tabular-nums">
        <span>{candidate.start_time}</span>
        <span>{candidate.end_time}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        {(Object.keys(ROLE_META) as Role[]).map((r) => (
          <li key={r} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", ROLE_META[r].color)} aria-hidden />
            {ROLE_META[r].label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EvidencePanel({
  candidate,
  segments,
  evaluation,
}: {
  candidate: Candidate;
  segments: ScreenplaySegment[];
  evaluation: EditorialEvaluation | null;
}) {
  const hasEvaluation = evaluation?.evaluation_status === "completed";
  const { roleOf, citedBy } = classify(hasEvaluation ? evaluation : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence and screenplay context</CardTitle>
        <CardDescription className="max-w-3xl">
          The screenplay segments inside this clip window
          {hasEvaluation ? ", with the segments the evaluator cited highlighted" : ""}. The evaluator
          works from screenplay text and timestamps only — not rendered video or audio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No screenplay segments were returned for this candidate.</p>
        ) : (
          <>
            <Timeline candidate={candidate} segments={segments} roleOf={roleOf} />
            <ol className="flex flex-col gap-2">
              {segments.map((s) => {
                const role = roleOf(s.segment_id);
                const cited = citedBy.get(s.segment_id);
                return (
                  <li
                    key={s.segment_id}
                    id={`evidence-${s.segment_id}`}
                    className={cn(
                      "scroll-mt-24 rounded-md border border-l-4 px-4 py-3 target:ring-2 target:ring-ring/40",
                      ROLE_META[role].border,
                      role === "context" ? "bg-card" : "bg-muted/40",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono font-medium text-foreground">{s.segment_id}</span>
                      <span className="font-mono tabular-nums">{s.timestamp}</span>
                      <span>{humanizeKey(s.segment_type)}</span>
                      {s.speaker && <span className="font-medium text-foreground">{s.speaker}</span>}
                      {role !== "context" && (
                        <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-foreground">
                          <span className={cn("size-2 rounded-sm", ROLE_META[role].color)} aria-hidden />
                          {ROLE_META[role].label}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 text-sm leading-relaxed",
                        s.segment_type === "dialogue" && "pl-4",
                        (s.segment_type === "scene_heading" || s.segment_type === "transition") &&
                          "font-mono text-[13px] uppercase tracking-wide",
                      )}
                    >
                      {s.text}
                    </p>
                    {cited && cited.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Cited for: {[...new Set(cited)].join(", ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}
