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
      <Link href="/" className="flex items-center gap-2 border-b-2 border-border px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center bg-accent text-sm font-black text-accent-fg">
          A
        </span>
        <span className="text-lg font-black tracking-tight uppercase-wide">
          Ascend
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 border-2 px-3 py-2.5 text-sm font-bold uppercase-wide transition-colors",
                active
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-transparent text-muted hover:border-border hover:text-foreground",
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
            "mt-2 flex items-center gap-3 border-2 px-3 py-2.5 text-sm font-bold uppercase-wide transition-colors",
            isActive(pathname, "/premium")
              ? "border-lime bg-lime text-accent-fg"
              : "border-lime/40 text-lime hover:border-lime",
          )}
        >
          <Crown size={18} />
          Premium
        </Link>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t-2 border-border p-3">
        {user ? (
          <Link
            href="/profile"
            className="flex min-w-0 items-center gap-2 text-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-border bg-surface-2 text-xs font-bold">
              {initialsFromName(profile?.username ?? user.email)}
            </span>
            <span className="min-w-0 truncate font-bold">
              {profile?.username ?? user.email}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="border-2 border-border px-3 py-1.5 text-sm font-bold uppercase-wide hover:border-accent hover:text-accent"
          >
            Log in
          </Link>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
