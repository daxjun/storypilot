"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMockMode } from "@/lib/config";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";

export function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex",
        collapsed ? "w-[64px]" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-0")}>
        <Link href="/dashboard" aria-label="StoryPilot home">
          <Logo collapsed={collapsed} />
        </Link>
      </div>
      <div className={cn("flex-1 overflow-y-auto p-3", collapsed && "px-2")}>
        <NavLinks collapsed={collapsed} />
      </div>
      <div className={cn("border-t p-3", collapsed && "px-2")}>
        {!collapsed && (
          <p className="mb-2 px-2.5 text-xs text-muted-foreground">
            {isMockMode ? "Mock mode · demo data" : "Connected to backend API"}
          </p>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex h-8 w-full items-center gap-3 rounded-md px-2.5 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
