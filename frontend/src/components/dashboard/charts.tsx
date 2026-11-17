
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/utils";

const AXIS = { fontSize: 12, fill: "var(--chart-axis)" };

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: Partial<TooltipContentProps<ValueType, NameType>> & {
  unit: string;
}) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0].value);

  return (
    <div className="rounded-md border bg-card px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">
        {value} {value === 1 ? unit : `${unit}s`}
      </p>
    </div>
  );
}

function SimpleBarChart({
  data,
  xKey,
  yKey,
  unit,
  ariaLabel,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  unit: string;
  ariaLabel: string;
}) {
  return (
    <div className="h-52 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
          />

          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            dy={4}
          />

          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={40}
          />

          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.8 }}
            content={(props) => (
              <ChartTooltip {...props} unit={unit} />
            )}
          />

          <Bar
            dataKey={yKey}
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CandidatesByEpisodeChart({
  data,
}: {
  data: { episode_number: number; candidates: number }[];
}) {
  const rows = data.map((d) => ({
    label: `Ep ${d.episode_number}`,
    candidates: d.candidates,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shortlisted candidates per episode</CardTitle>
        <CardDescription>
          Candidates retained after deduplication
        </CardDescription>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            title="No candidates yet"
            className="py-10"
          />
        ) : (
          <SimpleBarChart
            data={rows}
            xKey="label"
            yKey="candidates"
            unit="candidate"
            ariaLabel={`Bar chart of shortlisted candidates per episode: ${rows
              .map((r) => `${r.label} ${r.candidates}`)
              .join(", ")}`}
          />
        )}
      </CardContent>
    </Card>
  );
}

const SCORE_BINS = [
  { label: "< 6", min: -Infinity, max: 6 },
  { label: "6–7", min: 6, max: 7 },
  { label: "7–8", min: 7, max: 8 },
  { label: "8–9", min: 8, max: 9 },
  { label: "9–10", min: 9, max: Infinity },
];

export function ScoreDistributionChart({
  scores,
}: {
  scores: number[];
}) {
  const rows = SCORE_BINS.map((b) => ({
    label: b.label,
    clips: scores.filter(
      (s) => s >= b.min && s < b.max,
    ).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editorial score distribution</CardTitle>
        <CardDescription>
          Final scores of completed evaluations (out of 10)
        </CardDescription>
      </CardHeader>

      <CardContent>
        {scores.length === 0 ? (
          <EmptyState
            title="No completed evaluations"
            className="py-10"
          />
        ) : (
          <SimpleBarChart
            data={rows}
            xKey="label"
            yKey="clips"
            unit="clip"
            ariaLabel={`Histogram of editorial scores: ${rows
              .map((r) => `${r.label}: ${r.clips}`)
              .join(", ")}`}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function EvaluationCompletionCard({
  completed,
  failed,
  pending,
}: {
  completed: number;
  failed: number;
  pending: number;
}) {
  const total = completed + failed + pending;

  const parts = [
    {
      key: "completed",
      label: "Evaluated",
      value: completed,
      bar: "bg-success",
      dot: "bg-success",
    },
    {
      key: "failed",
      label: "Failed",
      value: failed,
      bar: "bg-danger",
      dot: "bg-danger",
    },
    {
      key: "pending",
      label: "Awaiting",
      value: pending,
      bar: "bg-muted-foreground/25",
      dot: "bg-muted-foreground/40",
    },
  ];

  const pct = total
    ? Math.round(((completed + failed) / total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation completion</CardTitle>
        <CardDescription>
          Selected candidates sent to the AI evaluator
        </CardDescription>
      </CardHeader>

      <CardContent>
        {total === 0 ? (
          <EmptyState
            title="No candidates selected for evaluation"
            className="py-10"
          />
        ) : (
          <div className="flex h-52 flex-col justify-center gap-5">
            <div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {pct}%
              </p>

              <p className="text-xs text-muted-foreground">
                {completed + failed} of {total} processed
              </p>
            </div>

            <div
              className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={parts
                .map((p) => `${p.label}: ${p.value}`)
                .join(", ")}
            >
              {parts
                .filter((p) => p.value > 0)
                .map((p) => (
                  <div
                    key={p.key}
                    className={cn(
                      "h-full first:rounded-l-full last:rounded-r-full",
                      p.bar,
                    )}
                    style={{
                      width: `${(p.value / total) * 100}%`,
                    }}
                    title={`${p.label}: ${p.value}`}
                  />
                ))}
            </div>

            <ul className="grid grid-cols-3 gap-2 text-xs">
              {parts.map((p) => (
                <li key={p.key}>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className={cn("size-2 rounded-full", p.dot)}
                      aria-hidden
                    />
                    {p.label}
                  </span>

                  <span className="mt-0.5 block text-sm font-medium tabular-nums">
                    {p.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
