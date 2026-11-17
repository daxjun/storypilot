"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Layers, XCircle, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEvent, ActivityType } from "@/types/api";

const ICONS: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  episode_processed: { icon: FileText, className: "text-muted-foreground" },
  episode_failed: { icon: XCircle, className: "text-danger" },
  candidates_generated: { icon: Layers, className: "text-primary" },
  evaluation_completed: { icon: CheckCircle2, className: "text-success" },
  evaluation_failed: { icon: XCircle, className: "text-danger" },
};

function hrefFor(e: ActivityEvent) {
  if (e.candidate_id) return `/candidates/${e.candidate_id}`;
  if (e.episode_id) return `/episodes/${e.episode_id}`;
  return null;
}

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
  // Relative times depend on the clock; render them after mount to avoid hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNow(new Date()), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        {events.length === 0 ? (
          <EmptyState title="No activity yet" className="py-8" />
        ) : (
          <ul className="flex flex-col">
            {events.map((e) => {
              const { icon: Icon, className } = ICONS[e.type];
              const href = hrefFor(e);
              const body = (
                <>
                  <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />
                  <span className="min-w-0 flex-1 text-[13px] leading-snug">{e.message}</span>
                  <time
                    dateTime={e.timestamp}
                    className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  >
                    {now ? formatRelativeTime(e.timestamp, now) : ""}
                  </time>
                </>
              );
              return (
                <li key={e.id}>
                  {href ? (
                    <Link href={href} className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-muted">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 px-3 py-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
