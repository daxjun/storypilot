export const DURATION_BUCKETS = [
  { value: "all", label: "Any duration" },
  { value: "short", label: "Under 30s", test: (s: number) => s < 30 },
  { value: "medium", label: "30–45s", test: (s: number) => s >= 30 && s <= 45 },
  { value: "long", label: "Over 45s", test: (s: number) => s > 45 },
] as const;

export type DurationBucket = (typeof DURATION_BUCKETS)[number]["value"];

export function matchesDuration(seconds: number, bucket: string) {
  const b = DURATION_BUCKETS.find((d) => d.value === bucket);
  if (!b || !("test" in b)) return true;
  return b.test(seconds);
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    pageItems: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageCount,
  };
}
