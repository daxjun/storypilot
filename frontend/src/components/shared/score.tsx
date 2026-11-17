import { formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Editorial score out of 10, or an em dash when not available. */
export function EditorialScore({
  score,
  className,
  showScale = false,
}: {
  score: number | null | undefined;
  className?: string;
  showScale?: boolean;
}) {
  if (score == null) {
    return (
      <span className={cn("text-muted-foreground", className)} aria-label="Not evaluated">
        —
      </span>
    );
  }
  return (
    <span className={cn("font-medium tabular-nums", className)}>
      {formatScore(score)}
      {showScale && <span className="font-normal text-muted-foreground"> / 10</span>}
    </span>
  );
}

/** Compact horizontal score bar out of 10. */
export function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      <div className="h-full rounded-full bg-primary" style={{ width: `${(score / 10) * 100}%` }} />
    </div>
  );
}
