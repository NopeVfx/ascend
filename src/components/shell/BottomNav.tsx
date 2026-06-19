"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/shell/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 rounded-t-2xl border-t-2 border-border bg-surface shadow-[0_-4px_14px_0_color-mix(in_srgb,var(--foreground)_5%,transparent)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "btn-bubbly flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase-wide transition-colors",
              active ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            <span className={cn("p-1 rounded-xl transition-colors", active ? "bg-accent/10" : "")}>
              <Icon size={20} />
            </span>
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
