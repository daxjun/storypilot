"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { NavLinks } from "./sidebar";
import { EvaluationIndicator } from "./evaluation-indicator";

function useBreadcrumb() {
  const pathname = usePathname();
  const section = NAV_ITEMS.find((n) => isActive(pathname, n.href));
  const parts = pathname.split("/").filter(Boolean);
  const detail = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
  return { section, detail };
}

export function Topbar() {
  const { section, detail } = useBreadcrumb();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/candidates?q=${encodeURIComponent(q)}` : "/candidates");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">StoryPilot sections</SheetDescription>
          <div className="flex h-14 items-center border-b px-4">
            <Logo />
          </div>
          <div className="p-3">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        {section ? (
          detail ? (
            <>
              <Link href={section.href} className="truncate text-muted-foreground hover:text-foreground">
                {section.label}
              </Link>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate font-medium" aria-current="page">
                {detail}
              </span>
            </>
          ) : (
            <span className="truncate font-medium" aria-current="page">
              {section.label}
            </span>
          )
        ) : (
          <span className="font-medium">StoryPilot</span>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <form onSubmit={onSearch} role="search" className="relative hidden md:block">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find candidate ID…"
            aria-label="Search candidates by ID"
            className="h-8 w-52 pl-8 text-[13px]"
          />
        </form>
        <DemoBadge />
        <EvaluationIndicator />
        <div
          className="grid size-8 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
          role="img"
          aria-label="Editor profile (placeholder)"
          title="Editor (placeholder profile)"
        >
          ED
        </div>
      </div>
    </header>
  );
}
