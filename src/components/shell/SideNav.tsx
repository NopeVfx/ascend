"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown } from "lucide-react";
import { NAV_ITEMS, isActive } from "@/components/shell/nav";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn, initialsFromName } from "@/lib/utils";

export function SideNav() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-border bg-surface md:flex">
      <Link href="/" className="group flex items-center gap-3 border-b-2 border-border px-5 py-5 transition-colors hover:bg-surface-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-black text-accent-fg glow-border">
          A
        </span>
        <span className="text-lg font-black tracking-tight uppercase-wide">
          Ascend
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "btn-bubbly group flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-bold uppercase-wide transition-all glow-border-hover",
                active
                  ? "border-accent bg-accent text-accent-fg glow-border"
                  : "border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/premium"
          className={cn(
            "btn-bubbly mt-2 flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-bold uppercase-wide transition-all glow-border-hover",
            isActive(pathname, "/premium")
              ? "border-lime bg-lime text-accent-fg glow-border"
              : "border-lime/40 text-lime hover:border-lime",
          )}
        >
          <Crown size={18} />
          Premium
        </Link>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t-2 border-border p-4">
        {user ? (
          <Link
            href="/profile"
            className="btn-bubbly flex min-w-0 items-center gap-2 rounded-xl p-1 pr-2 text-sm transition-colors hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-surface-2 text-xs font-bold glow-border">
              {initialsFromName(profile?.username ?? user.email)}
            </span>
            <span className="min-w-0 truncate font-bold">
              {profile?.username ?? user.email}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="btn-bubbly rounded-xl border-2 border-border px-3 py-1.5 text-sm font-bold uppercase-wide transition-all hover:border-accent hover:text-accent glow-border-hover"
          >
            Log in
          </Link>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
