import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
        {/* A paper plane over a script line: "pilot" for stories */}
        <path d="M4 12.5 20 5l-4.5 15-3.5-6-8-1.5Z" strokeLinejoin="round" />
        <path d="m12 14 8-9" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && <span className="text-[15px] font-semibold tracking-tight">StoryPilot</span>}
    </span>
  );
}
