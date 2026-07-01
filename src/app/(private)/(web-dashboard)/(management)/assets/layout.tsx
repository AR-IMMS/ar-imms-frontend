"use client";

import Header from "@/components/layout/web-dashboard/header";
import BulkMarkerExport from "@/features/web-dashboard/asset-management/bulk-marker-export";
import HierarchicalTreeSidebar from "@/features/web-dashboard/asset-management/components/hierachical-tree";
import { UnmappedAssetsDrawer } from "@/features/web-dashboard/asset-management/components/unmapped-asset-drawer";
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
    <div className="flex flex-col gap-4 flex-1 min-h-0 w-full overflow-hidden">
      <div className="pt-6 px-6">
        <Header
          eyebrow="ADMIN // TOPOLOGY VISUALIZER"
          title="Asset Management"
          // subtitle="Three-layout topology · digital twin · marker mapping"
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
      </div>

      <div className="relative flex items-stretch flex-1 min-h-0 w-full overflow-hidden">
        <aside className="w-[20%] min-w-40 pl-6 pb-6 z-10 shrink-0 flex flex-col overflow-hidden">
          <HierarchicalTreeSidebar />
        </aside>

        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {children}
        </main>

        <UnmappedAssetsDrawer />
      </div>

      {/* {registerOpen && <RegisterRackModal onClose={() => setRegisterOpen(false)} />} */}
      {exportOpen && <BulkMarkerExport onClose={() => setExportOpen(false)} />}
    </div>
  );
}
