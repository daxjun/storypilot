/** Formats seconds as "34s" or "1m 05s". */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/**
 * Editorial scores are out of 10. Shown with at least one decimal and up to
 * two, so the backend's precision is preserved (8.25 is not rounded to 8.3
 * next to a real 8.3). Pass `digits` to force a fixed number of decimals.
 */
export function formatScore(score: number | null | undefined, digits?: number) {
  if (score == null || Number.isNaN(score)) return "—";
  if (digits !== undefined) return score.toFixed(digits);
  const rounded = Math.round(score * 100) / 100;
  return Number.isInteger(rounded * 10) ? rounded.toFixed(1) : rounded.toFixed(2);
}

/** Preliminary (heuristic) scores are shown as-is with two decimals. */
export function formatPreliminary(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return "—";
  return score.toFixed(2);
}

export function formatRelativeTime(iso: string, now: Date = new Date()) {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.round(diffMs / 60000);
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function humanizeKey(key: string) {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
