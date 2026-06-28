import type { ReactNode } from "react";
import TopBar from "@/components/layout/web-dashboard/topbar";
import Sidebar from "@/components/layout/web-dashboard/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full text-foreground">
      <TopBar />
      <div className="flex w-full">
        <Sidebar />
        <main className="flex-1 px-6 py-6 space-y-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
