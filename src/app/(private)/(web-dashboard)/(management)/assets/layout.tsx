"use client";

import Header from "@/components/layout/web-dashboard/header";
import BulkMarkerExport from "@/features/web-dashboard/asset-management/bulk-marker-export";
import HierarchicalTreeSidebar from "@/features/web-dashboard/asset-management/components/hierachical-tree";
import { QrCode, Plus } from "lucide-react";
import { ReactNode, useState } from "react";

export default function AssetManagementLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Header
        eyebrow="ADMIN // TOPOLOGY VISUALIZER"
        title="Asset Management"
        subtitle="Three-layout topology · digital twin · marker mapping"
        actions={
          <>
            <button
              onClick={() => setExportOpen(true)}
              disabled={registerOpen}
              className="glass rounded-lg px-3 py-2 text-xs label-mono text-cyan-ice hover:border-cyan/50 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <QrCode className="size-3.5" /> Bulk Marker Export
            </button>
            <button
              onClick={() => setRegisterOpen(true)}
              disabled={exportOpen}
              className="rounded-lg px-3 py-2 text-xs label-mono bg-gradient-to-r from-cyan to-electric text-primary-foreground hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-3.5" /> Register New Rack
            </button>
          </>
        }
      />

      <div className="flex gap-4 w-full items-start h-[calc(100vh-210px)]">
        <aside className="w-[22%] min-w-40 z-10 shrink-0 sticky h-full top-0 flex flex-col">
          <HierarchicalTreeSidebar />
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* {registerOpen && <RegisterRackModal onClose={() => setRegisterOpen(false)} />} */}
      {exportOpen && <BulkMarkerExport onClose={() => setExportOpen(false)} />}
    </div>
  );
}
