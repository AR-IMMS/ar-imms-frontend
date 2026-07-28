"use client";

import { useMemo } from "react";
import { Monitor, CpuIcon, Activity, RefreshCcw } from "lucide-react";
import { useMonitoringStore } from "@/stores/monitoring-store";
import CopyableUserId from "@/components/common/copyable-user-id";
import { SEVERITY_COLORS, STATUS_COLORS } from "../lib/constant";

interface MonitoringNodeDetailPanelProps {
  nodeCode: string;
}

export function MonitoringNodeDetailPanel({
  nodeCode,
}: MonitoringNodeDetailPanelProps) {
  const overviewState = useMonitoringStore(
    (s) => s.nodesOverview[nodeCode || ""],
  );

  const overview = overviewState.overview;

  const nodeInfo = useMemo(() => {
    if (!overview || !overview.node) return null;
    const { node, summaryMetrics } = overview;

    return {
      nodeId: node.nodeId,
      status: node.status,
      severity: node.severity,
      lastSeenAt: node.lastSeenAt,
      freshnessSec: node.freshnessSec,
      fingerprintSeenAt: node.fingerprintSeenAt,
      batteryModel: node.batteryModel || "N/A",
      cpuArchitecture: node.cpuArchitecture || "N/A",
      cpuModel: node.cpuModel || "N/A",
      gpuModelPrimary: node.gpuModelPrimary || "N/A",
      hardwareSerial: node.hardwareSerial || "N/A",
      logicalCpuCount: node.logicalCpuCount || 0,
      macAddress: node.macAddress || "N/A",
      motherboardModel: node.motherboardModel || "N/A",
      osProduct: node.osProduct || "N/A",
      primaryIpv4: node.primaryIpv4 || "N/A",
      ssdModelPrimary: node.ssdModelPrimary || "N/A",
      worstMetric: summaryMetrics?.worstMetric,
    };
  }, [overview]);

  if (!nodeCode) return null;

  if (overviewState.loading && !nodeInfo) {
    return (
      <div className="w-80 h-full border-l border-border bg-background/50 backdrop-blur-md p-4 animate-pulse space-y-4 shrink-0 overflow-y-auto">
        <div className="h-6 bg-white/5 rounded w-1/3" />
        <div className="h-12 bg-white/5 rounded w-full" />
        <div className="h-32 bg-white/5 rounded w-full" />
      </div>
    );
  }

  if (!nodeInfo) return null;

  return (
    <div className="w-[24%] h-full border-l border-border bg-background/50 backdrop-blur-md p-4 shrink-0 overflow-y-auto font-mono text-xs flex flex-col justify-between custom-scrollbar">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="label-mono text-[9px] text-cyan-ice uppercase tracking-wider">
              LIVE NODE SNAPSHOT
            </div>
            <div
              className="title-display mt-1 text-sm text-foreground truncate max-w-[200px]"
              title={nodeInfo.nodeId}
            >
              {nodeInfo.nodeId}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {/* Status Badge */}
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${STATUS_COLORS[nodeInfo.status] || ""}`}
              >
                {nodeInfo.status}
              </span>
              {/* Severity Badge */}
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${SEVERITY_COLORS[nodeInfo.severity] || ""}`}
              >
                {nodeInfo.severity}
              </span>
            </div>
          </div>
        </div>

        {/* Triage Freshness State */}
        <div className="panel bg-surface-1/40 p-2.5 space-y-2 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <RefreshCcw className="size-3" /> Last Seen At:
            </span>
            <span className="text-slate-200">
              {new Date(nodeInfo.lastSeenAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="size-3 text-cyan-ice" /> Freshness:
            </span>
            <span
              className={`font-semibold ${nodeInfo.freshnessSec > 60 ? "text-amber" : "text-cyan"}`}
            >
              {nodeInfo.freshnessSec}s ago
            </span>
          </div>
        </div>

        {/* Physical Context / Hardware Blueprint */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 label-mono text-[10px] text-muted-foreground border-b border-border/80 pb-1">
            <Monitor className="size-3.5 text-cyan-ice" /> System Identity
          </div>
          <div className="panel bg-surface-1/40 p-2.5 space-y-2 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Primary IP:</span>
              <span className="text-slate-200">
                <CopyableUserId
                  value={nodeInfo.primaryIpv4}
                  className="text-[10px]"
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MAC Address:</span>
              <span className="text-slate-200 text-[9px]">
                <CopyableUserId
                  value={nodeInfo.macAddress}
                  className="text-[9px]"
                />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hardware Serial:</span>
              <span className="text-slate-200">
                <CopyableUserId
                  value={nodeInfo.hardwareSerial}
                  className="text-[10px]"
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-mono">
                Motherboard:
              </span>
              <span
                className="text-slate-200 text-right truncate max-w-[125px]"
                title={nodeInfo.motherboardModel}
              >
                {nodeInfo.motherboardModel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-mono">
                Operating Sys:
              </span>
              <span
                className="text-slate-200 text-right truncate max-w-[125px]"
                title={nodeInfo.osProduct}
              >
                {nodeInfo.osProduct}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Architecture Specs */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 label-mono text-[10px] text-muted-foreground border-b border-border/80 pb-1">
            <CpuIcon className="size-3.5 text-cyan-ice" /> Telemetry Specs
          </div>
          <div className="panel bg-surface-1/40 p-2.5 space-y-2 text-[10px]">
            <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground">Processor Model:</span>
              <span
                className="text-slate-200 font-semibold text-[9.5px] leading-relaxed"
                title={nodeInfo.cpuModel}
              >
                {nodeInfo.cpuModel}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/20 pt-1.5 mt-1.5">
              <span className="text-muted-foreground">
                Architecture / Cores:
              </span>
              <span className="text-slate-200">
                {nodeInfo.cpuArchitecture} / {nodeInfo.logicalCpuCount} Cores
              </span>
            </div>
            <div className="flex flex-col space-y-1 border-t border-border/20 pt-1.5">
              <span className="text-muted-foreground">
                Primary Graphics GPU:
              </span>
              <span
                className="text-slate-200 text-[9.5px]"
                title={nodeInfo.gpuModelPrimary}
              >
                {nodeInfo.gpuModelPrimary}
              </span>
            </div>
            <div className="flex flex-col space-y-1 border-t border-border/20 pt-1.5">
              <span className="text-muted-foreground">
                Primary Solid State SSD:
              </span>
              <span
                className="text-slate-200 text-[9.5px]"
                title={nodeInfo.ssdModelPrimary}
              >
                {nodeInfo.ssdModelPrimary}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/20 pt-1.5">
              <span className="text-muted-foreground">Battery Model:</span>
              <span className="text-slate-200">{nodeInfo.batteryModel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
