"use client";

import Header from "@/components/layout/web-dashboard/header";
import BulkMarkerExport from "@/features/web-dashboard/asset-management/bulk-marker-export";
import HierarchicalTreeSidebar from "@/features/web-dashboard/asset-management/components/hierachical-tree";
import { UnmappedAssetsDrawer } from "@/features/web-dashboard/asset-management/unmapped-asset-drawer";
import { QrCode, Plus } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import {
  useSidebarStore,
  type NavigationPathItem,
} from "@/stores/sidebar-store";
import { motion } from "framer-motion";
import { WorkspaceBreadcrumbs } from "@/features/web-dashboard/asset-management/components/workspace-breadcrumbs";

export default function AssetManagementLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { setCreateEditRackModal } = useAssetStore();
  const [exportOpen, setExportOpen] = useState(false);

  const { isTopologyTreeCollapsed, setActiveNavigationPath } =
    useSidebarStore();
  const { selectedSiteCode, selectedRoomCode, selectedAsset, topologyData } =
    useAssetStore();

  // Dynamic hierarchy synchronization
  useEffect(() => {
    const path: NavigationPathItem[] = [];
    if (selectedSiteCode !== null) {
      path.push({
        id: selectedSiteCode,
        name: selectedSiteCode || "Unassigned Site",
        type: "site",
      });

      if (selectedRoomCode !== null) {
        path.push({
          id: selectedRoomCode,
          name: selectedRoomCode || "Unknown Room",
          type: "room",
        });

        if (selectedAsset !== null && selectedAsset.assetType === "rack") {
          const rack = topologyData.find(
            (t) => t.rack.id === selectedAsset.id,
          )?.rack;
          const rackName = rack
            ? rack.displayName || rack.rackCode
            : selectedAsset.id;
          path.push({
            id: selectedAsset.id,
            name: rackName,
            type: "rack",
          });
        }
      }
    }
    setActiveNavigationPath(path);
  }, [
    selectedSiteCode,
    selectedRoomCode,
    selectedAsset,
    topologyData,
    setActiveNavigationPath,
  ]);

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
                // disabled={registerOpen}
                disabled={true}
                className="glass rounded-lg px-3 py-2 text-xs label-mono text-cyan-ice hover:border-cyan/50 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <QrCode className="size-3.5" /> Bulk Marker Export
              </button>
              <button
                onClick={() => setCreateEditRackModal({ isOpen: true })}
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
        <motion.aside
          initial={false}
          animate={{
            width: isTopologyTreeCollapsed ? 0 : "20%",
            minWidth: isTopologyTreeCollapsed ? 0 : 240,
            paddingLeft: 24,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative pb-6 z-10 shrink-0 flex flex-col overflow-visible"
        >
          <HierarchicalTreeSidebar />
        </motion.aside>

        <main className="relative flex-1 min-w-0 overflow-hidden flex flex-col">
          <WorkspaceBreadcrumbs />
          <div className="flex-1 min-h-0 h-full w-full">{children}</div>
        </main>

        <UnmappedAssetsDrawer />
      </div>

      {exportOpen && <BulkMarkerExport onClose={() => setExportOpen(false)} />}
    </div>
  );
}
