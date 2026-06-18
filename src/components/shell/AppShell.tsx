import { SideNav } from "@/components/shell/SideNav";
import { BottomNav } from "@/components/shell/BottomNav";
import { MobileHeader } from "@/components/shell/MobileHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <SideNav />
      <MobileHeader />
      <main className="min-h-dvh pb-20 md:pb-0 md:pl-60">{children}</main>
      <BottomNav />
    </div>
  );
}
