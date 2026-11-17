import { FlaskConical } from "lucide-react";
import { isMockMode } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Visible whenever the UI is showing demo data instead of backend results. */
export function DemoBadge({ className }: { className?: string }) {
  if (!isMockMode) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-warning/25 bg-warning-soft px-2 py-1 text-xs font-medium text-warning",
        className,
      )}
      title="Mock mode: this is demo data, not results from the StoryPilot backend. Set NEXT_PUBLIC_DATA_MODE=api to use the backend."
    >
      <FlaskConical className="size-3.5" aria-hidden />
      Demo<span className="hidden sm:inline"> data</span>
    </span>
  );
}
