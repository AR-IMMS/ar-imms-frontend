"use client";

import { use, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRackOverview } from "@/hooks/monitoring/use-rack-overview";
import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import RackTelemetryViewport from "@/features/web-dashboard/monitoring/rack-telemetry-viewport";
import { RackAssetPanel } from "@/features/web-dashboard/monitoring/components/rack-asset-panel";

interface Props {
  params: Promise<{
    rackId: string;
  }>;
}

export default function RackMonitoringPage({ params }: Props) {
  const { rackId } = use(params);
  const { overview, loading } = useRackOverview(rackId);

  // Synchronize hierarchy parameters to AssetStore to align tree/breadcrumbs selection state
  useEffect(() => {
    if (overview?.rack?.rackInfo) {
      const { siteCode, roomCode } = overview.rack.rackInfo;
      useAssetStore.setState({
        selectedSiteCode: siteCode || "",
        selectedRoomCode: roomCode || "",
        selectedRackId: rackId,
        selectedNodeCode: null,
      });
    }
  }, [overview, rackId]);

  if (loading && !overview) {
    return (
      <div className="flex-1 flex items-center justify-center h-full w-full bg-slate-950/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-cyan animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Initializing rack telemetry context...
          </span>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex-1 flex items-center justify-center h-full w-full bg-slate-950/20">
        <span className="text-xs font-mono text-slate-500 uppercase">
          Rack overview metrics context unavailable.
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-0.5 w-full flex-1 min-h-0 overflow-hidden bg-slate-950/40">
      <RackTelemetryViewport rackId={rackId} overview={overview} />
      <RackAssetPanel overview={overview} />
    </div>
  );
}
