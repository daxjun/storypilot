import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EDITORIAL_DIMENSIONS, formatWeight } from "@/lib/scoring";

export function RankingMethodology() {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 text-[13px]">
          <p className="font-medium">How ranking works</p>
          <p className="mt-0.5 text-muted-foreground">
            Clips are ordered by the final editorial score returned by the evaluator — a weighted
            average of five dimensions. Only successfully evaluated candidates are ranked.
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {EDITORIAL_DIMENSIONS.map((d) => (
              <li
                key={d.key}
                className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
                title={d.description}
              >
                {d.label} <span className="font-medium tabular-nums">{formatWeight(d.weight)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
