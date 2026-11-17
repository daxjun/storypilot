import { Lightbulb, MessageSquareQuote, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EditorialEvaluation } from "@/types/evaluation";

function Block({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon: typeof Sparkles;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden />
      <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {title}
      </h3>
      <div className="mt-2.5 text-sm leading-relaxed">{children}</div>
    </Card>
  );
}

export function PromoContent({ evaluation }: { evaluation: EditorialEvaluation }) {
  const missing = <span className="text-muted-foreground">Not provided by the evaluator.</span>;
  return (
    <section aria-label="Promotional content" className="grid gap-4 md:grid-cols-3">
      <Block title="Suggested hook" icon={MessageSquareQuote} accent="bg-[var(--role-hook)]">
        {evaluation.hook || missing}
      </Block>
      <Block title="Suggested cliffhanger" icon={Sparkles} accent="bg-[var(--role-cliff)]">
        {evaluation.cliffhanger || missing}
      </Block>
      <Block title="Why this clip works" icon={Lightbulb} accent="bg-border">
        {evaluation.why_it_works || missing}
      </Block>
    </section>
  );
}
