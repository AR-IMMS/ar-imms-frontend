"use client";

import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { useTopologyTreeQuery } from "@/hooks/asset/use-asset-queries";

import { Loader2 } from "lucide-react";

import ConfirmRetireModal from "@/features/web-dashboard/asset-management/components/modal/confirm-activate-retire-modal";
import ConfirmMoveAsset from "@/features/web-dashboard/asset-management/components/modal/confirm-move-asset-modal";
import CreateEditRackModal from "@/features/web-dashboard/asset-management/components/modal/create-edit-rack-modal";
import AssignUnmapNodeModal from "@/features/web-dashboard/asset-management/components/modal/select-node-slot-modal";
import { TopologyPage } from "@/features/web-dashboard/asset-management/data-center-view";

// Data center/Row layer
export default function AssetOverviewtPage() {
  const { createEditRackModal } = useAssetStore();
  const { isLoading, isError, refetch } = useTopologyTreeQuery();

  if (isLoading) {
    return (
      <div className="flex-1 h-full w-full flex flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="size-8 text-cyan animate-spin" />
        <span className="font-mono text-xs text-muted-foreground">
          Initializing Spatial Canvas...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 h-full w-full flex flex-col items-center justify-center gap-4 text-center p-8">
        <div>
          <div className="text-sm font-mono font-semibold text-critical">
            Failed to fetch asset telemetry
          </div>
          <div className="text-xs font-mono text-muted-foreground/60 mt-1">
            Please check your network status
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-white/5 border border-critical/40 rounded-lg text-xs label-mono text-foreground hover:border-critical/70 transition cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 w-full flex-1 min-h-0 overflow-hidden">
      <TopologyPage />
      <ConfirmRetireModal />
      <AssignUnmapNodeModal />
      <ConfirmMoveAsset />
      <CreateEditRackModal
        key={
          createEditRackModal?.isOpen
            ? createEditRackModal?.rackId || "new"
            : "closed"
        }
      />
    </div>
  );
}
