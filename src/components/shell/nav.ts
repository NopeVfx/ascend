import { Home, ScanFace, User, Video, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: Home },
  { href: "/meeting", label: "Meeting Room", short: "Room", icon: Video },
  { href: "/analyzer", label: "AI Analyzer", short: "Analyze", icon: ScanFace },
  { href: "/profile", label: "Profile", short: "Profile", icon: User },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
