import { AlertTriangle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EditorialEvaluation } from "@/types/evaluation";

const SECTIONS = [
  { key: "strengths", title: "Strengths", icon: ThumbsUp, iconClass: "text-success" },
  { key: "weaknesses", title: "Weaknesses", icon: ThumbsDown, iconClass: "text-muted-foreground" },
  { key: "risks", title: "Risks", icon: AlertTriangle, iconClass: "text-warning" },
] as const;

export function Findings({ evaluation }: { evaluation: EditorialEvaluation }) {
  return (
    <div className="flex flex-col gap-4">
      {SECTIONS.map(({ key, title, icon: Icon, iconClass }) => {
        const items = evaluation[key] ?? [];
        return (
          <Card key={key} className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Icon className={`size-4 ${iconClass}`} aria-hidden />
              {title}
            </h3>
            {items.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted-foreground">None noted.</p>
            ) : (
              <ul className="mt-2.5 flex flex-col gap-1.5 text-[13px] leading-relaxed">
                {items.map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-[9px] size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
