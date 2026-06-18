"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/shell/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-2 border-border bg-surface md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase-wide transition-colors",
              active ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            <Icon size={20} />
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
