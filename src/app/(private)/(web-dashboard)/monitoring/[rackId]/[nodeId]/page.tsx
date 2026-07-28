"use client";

import { useEffect, use } from "react";
import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { MonitoringNodeDetailPanel } from "@/features/web-dashboard/monitoring/components/monitoring-node-detail-panel";
import MonitoringTelemetryViewport from "@/features/web-dashboard/monitoring/monitoring-telemetry-viewport";
import { useNodeContextQuery } from "@/hooks/asset/use-asset-queries";
import { Loader2 } from "lucide-react";

interface Props {
  params: Promise<{
    rackId: string;
    nodeId: string;
  }>;
}

export default function NodeMonitoringPage({ params }: Props) {
  const { nodeId } = use(params);
  const {
    setSelectedNodeCode,
    setSelectedSiteCode,
    setSelectedRoomCode,
    setSelectedRackId,
  } = useAssetStore();

  const { data: nodeContext, isLoading } = useNodeContextQuery(nodeId, !!nodeId);

  // Resolve and synchronize the full parent hierarchy (site, room, rack) from node context
  useEffect(() => {
    if (nodeContext) {
      setSelectedSiteCode(nodeContext?.rack?.siteCode || "");
      setSelectedRoomCode(nodeContext?.rack?.roomCode || "");
      setSelectedRackId(nodeContext?.rack?.id || "");
      setSelectedNodeCode(nodeId);
    }
  }, [
    nodeContext,
    nodeId,
    setSelectedNodeCode,
    setSelectedSiteCode,
    setSelectedRoomCode,
    setSelectedRackId,
  ]);

  if (isLoading || !nodeContext?.node) {
    return (
      <div className="flex-1 flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-cyan animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading node telemetry context...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 w-full flex-1 min-h-0 overflow-hidden">
      <MonitoringTelemetryViewport nodeCode={nodeContext.node.nodeCode} />
      <MonitoringNodeDetailPanel nodeCode={nodeContext.node.nodeCode} />
    </div>
  );
}
