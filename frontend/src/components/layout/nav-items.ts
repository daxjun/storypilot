import {
  Clapperboard,
  Film,
  Gauge,
  ListOrdered,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/episodes", label: "Episodes", icon: Film },
  { href: "/candidates", label: "Clip Candidates", icon: Clapperboard },
  { href: "/rankings", label: "Editorial Rankings", icon: ListOrdered },
  { href: "/evaluations", label: "Evaluations", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
