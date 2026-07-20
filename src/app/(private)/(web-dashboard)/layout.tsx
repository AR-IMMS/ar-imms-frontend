import type { ReactNode } from "react";
import TopBar from "@/components/layout/web-dashboard/topbar";
import Sidebar from "@/components/layout/web-dashboard/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-foreground bg-background">
      <TopBar />
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
