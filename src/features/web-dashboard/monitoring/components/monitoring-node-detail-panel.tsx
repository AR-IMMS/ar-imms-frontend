"use client";

import React, { useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Monitor, CpuIcon, Activity, RefreshCcw } from "lucide-react";
import { useMonitoringStore } from "@/stores/monitoring-store";
import CopyableUserId from "@/components/common/copyable-user-id";
import {
  COLLECTOR_STATUS_COLOR_TEXT,
  STATUS_COLOR_TEXT,
  STATUS_EXPLANATIONS,
} from "../lib/constant";
import Stat from "@/components/common/stat";
import { DiscoveredNodeEntity, NodeEntity } from "@/types/assets";
import { InfoTooltip } from "@/components/common/infor-tooltip";
import { CollectorStatusInfo, NodeHardwareInfo } from "@/types/monitoring";
import { parseToLocalDate } from "@/lib/utils/formatTime";

interface MonitoringNodeDetailPanelProps {
  nodeItem: NodeEntity;
}

// Memoized Asset Identity Section to prevent re-renders when data updates
const AssetIdentitySection = React.memo(
  ({
    primaryIpv4,
    macAddress,
    hardwareSerial,
    osProduct,
    model,
    vendor,
  }: {
    primaryIpv4: string;
    macAddress: string;
    hardwareSerial: string;
    osProduct: string;
    model: string;
    vendor: string;
  }) => {
    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 label-mono text-[10.5px] text-muted-foreground border-b border-border/80 pb-2">
          <Monitor className="size-3.5 text-cyan-ice" /> Asset Identity
        </div>

        <div className="panel rounded bg-surface-1/40 mt-3 p-2.5 space-y-2">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Primary IP
            </span>
            <span className="text-foreground">
              <CopyableUserId value={primaryIpv4} className="text-[10px]" />
            </span>
          </div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              MAC Address
            </span>
            <span className="text-foreground text-[10px]">
              <CopyableUserId value={macAddress} className="text-[10px]" />
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Hardware Serial
            </span>
            <span className="text-foreground">
              <CopyableUserId value={hardwareSerial} className="text-[10px]" />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Operating Sys
            </span>
            <span
              className="text-foreground text-right truncate max-w-[65%] tooltip"
              title={osProduct}
            >
              {osProduct || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Model
            </span>
            <span className="text-foreground text-right">{model || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Vendor
            </span>
            <span
              className="text-foreground text-right truncate max-w-[65%] tooltip"
              title={vendor || "N/A"}
            >
              {vendor || "N/A"}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

AssetIdentitySection.displayName = "AssetIdentitySection";

// Memoized Hardware Specifications Section to prevent re-renders when data updates
const HardwareSpecificationsSection = React.memo(
  ({
    motherboardModel,
    cpuModel,
    arch,
    cpuArchitecture,
    logicalCpuCount,
    gpuModelPrimary,
    ssdModelPrimary,
    batteryModel,
  }: {
    motherboardModel: string;
    cpuModel: string;
    arch: string;
    cpuArchitecture: string;
    logicalCpuCount: number;
    gpuModelPrimary: string;
    ssdModelPrimary: string;
    batteryModel: string;
  }) => {
    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 label-mono text-[10.5px] text-muted-foreground border-b border-border/80 pb-2">
          <CpuIcon className="size-3.5 text-cyan-ice" /> HARDWARE SPECIFICATIONS
        </div>

        <div className="panel rounded bg-surface-1/40 mt-3 p-2.5 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Motherboard
            </span>
            <span
              className="text-foreground text-right truncate max-w-[60%] tooltip"
              title={motherboardModel}
            >
              {motherboardModel}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              CPU Model
            </span>
            <span
              className="text-foreground text-right text-[11px] truncate max-w-[60%] tooltip"
              title={cpuModel}
            >
              {cpuModel}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              CPU Architecture
            </span>
            <span className="text-foreground text-right text-[11px]">
              {arch}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Architecture/Cores
            </span>
            <span className="text-foreground text-[11px]">
              {cpuArchitecture} / {logicalCpuCount} Cores
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Primary Graphics GPU
            </span>
            <span
              className="text-foreground text-[11px] truncate max-w-[60%] tooltip"
              title={gpuModelPrimary}
            >
              {gpuModelPrimary}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Primary Solid State SSD
            </span>
            <span
              className="text-foreground text-[11px] truncate max-w-[60%] tooltip"
              title={ssdModelPrimary}
            >
              {ssdModelPrimary}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-semibold text-[10.5px] uppercase">
              Battery Model
            </span>
            <span
              className="text-foreground text-[11px] truncate max-w-[60%] tooltip"
              title={batteryModel}
            >
              {batteryModel}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

HardwareSpecificationsSection.displayName = "HardwareSpecificationsSection";

const DEFAULT_OVERVIEW_STATE = { overview: null, loading: false, error: null };

export function MonitoringNodeDetailPanel({
  nodeItem,
}: MonitoringNodeDetailPanelProps) {
  const overviewState = useMonitoringStore(
    (s) => s.nodesOverview[nodeItem?.nodeCode || ""] || DEFAULT_OVERVIEW_STATE,
  );
  const overview = overviewState.overview;

  const nodeInfo = useMemo(() => {
    if (!overview || !overview.node || !nodeItem) return null;
    const { node } = overview;

    const nodeHardware = node.hardware as NodeHardwareInfo;
    const nodeMetaData = nodeItem.metadata
      ?.discoveredNode as DiscoveredNodeEntity;
    const nodeCollector = node.collector as CollectorStatusInfo;

    // Localize and format last seen date and distance
    const localLastSeenDate = parseToLocalDate(node.lastSeenAt);
    const lastSeenAtDate = localLastSeenDate
      ? format(localLastSeenDate, "dd/MM/yyyy - HH:mm:ss")
      : "N/A";
    const lastSeenAtDistance = localLastSeenDate
      ? formatDistanceToNow(localLastSeenDate, {
          addSuffix: true,
          includeSeconds: true,
        })
      : "N/A";

    // Localize and format last heartbeat date
    const localLastHeartbeatDate = parseToLocalDate(
      nodeCollector.lastHeartbeatAt,
    );
    const lastHeartbeatAtDate = localLastHeartbeatDate
      ? format(localLastHeartbeatDate, "dd/MM/yyyy - HH:mm:ss")
      : "N/A";
    const lastHeartbeatAtDistance = localLastHeartbeatDate
      ? formatDistanceToNow(localLastHeartbeatDate, {
          addSuffix: true,
          includeSeconds: true,
        })
      : "N/A";

    return {
      // Node Overview
      nodeId: node.nodeId,
      status: node.status,
      reason: node.reason,
      lastSeenAtFormatted: lastSeenAtDate,
      lastSeenAtDistanceFormatted: lastSeenAtDistance,
      // Collect status
      collectorStatus: nodeCollector.status,
      collectorReason: nodeCollector.reason,
      lastHeartbeatAtFormatted: lastHeartbeatAtDate,
      lastHeartbeatAtDistanceFormatted: lastHeartbeatAtDistance,
      heartbeatTimeoutSec: nodeCollector.heartbeatTimeoutSec,
      // Node hardware
      batteryModel: nodeHardware.batteryModel || "N/A",
      cpuArchitecture: nodeHardware.cpuArchitecture || "N/A",
      cpuModel: nodeHardware.cpuModel || "N/A",
      gpuModelPrimary: nodeHardware.gpuModelPrimary || "N/A",
      hardwareSerial: nodeHardware.hardwareSerial || "N/A",
      logicalCpuCount: nodeHardware.logicalCpuCount || 0,
      macAddress: nodeHardware.macAddress || "N/A",
      motherboardModel: nodeHardware.motherboardModel || "N/A",
      osProduct: nodeHardware.osProduct || "N/A",
      model: nodeItem.model || "N/A",
      vendor: nodeItem.vendor || "N/A",
      arch: nodeMetaData?.hardware?.cpuArchitecture || "N/A",
      primaryIpv4: nodeHardware.primaryIpv4 || "N/A",
      ssdModelPrimary: nodeHardware.ssdModelPrimary || "N/A",
    };
  }, [overview, nodeItem]);

  if (overviewState.loading && !nodeInfo) {
    return (
      <div className="w-[25%] h-full border-l border-border bg-background/50 backdrop-blur-md p-4 animate-pulse space-y-4 shrink-0 overflow-y-auto">
        <div className="h-6 bg-white/5 rounded w-1/3" />
        <div className="h-12 bg-white/5 rounded w-full" />
        <div className="h-32 bg-white/5 rounded w-full" />
      </div>
    );
  }

  if (!nodeInfo || !nodeItem?.nodeCode) return null;

  return (
    <div className="w-[25%] glass h-full border-l border-border bg-background/50 backdrop-blur-md p-4 shrink-0 overflow-y-auto font-mono text-xs flex flex-col justify-between custom-scrollbar">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="label-mono light:text-primary light:font-bold text-[10px] text-cyan-ice uppercase tracking-wider">
              LIVE NODE SNAPSHOT
            </div>
            <div className="title-display mt-1 text-[1rem] text-foreground truncate max-w-70">
              {nodeItem.displayName || nodeItem.nodeCode}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="font-mono text-xs text-muted-foreground/60 light:text-muted-foreground/80 light:font-semibold">
                NODE CODE{": "}
              </div>
              <CopyableUserId
                value={nodeItem.nodeCode}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Triage Freshness State */}
        <div className="panel rounded bg-surface-1/40 light:bg-background light:border-2 light:border-cyan/45 p-3 mb-3 tracking-tight">
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground font-semibold text-[11px] uppercase flex items-center gap-2">
              <RefreshCcw className="size-3 text-cyan-ice" /> Last Seen At
            </div>
            <div className="flex flex-col items-end">
              <div className="text-foreground text-right font-semibold text-sm">
                {nodeInfo.lastSeenAtFormatted}
              </div>
              <div
                className={`-mt-0.5 text-xs ${nodeInfo.lastSeenAtDistanceFormatted.includes("less than") ? "text-cyan" : "text-amber"}`}
              >
                {nodeInfo.lastSeenAtDistanceFormatted}
              </div>
            </div>
          </div>

          <span className="block h-0.5 bg-border/65 w-full my-2"></span>

          <div className="flex justify-between items-center">
            <div className="text-muted-foreground font-semibold text-[11px] uppercase flex items-center gap-2">
              <Activity className="size-3 text-cyan-ice" /> Collector Last{" "}
              <br /> Heartbeat
            </div>
            <div className="flex flex-col items-end">
              <div className="text-foreground text-right font-semibold text-sm">
                {nodeInfo.lastHeartbeatAtFormatted}
              </div>
              <div
                className={`-mt-0.5 text-xs ${nodeInfo.lastHeartbeatAtDistanceFormatted.includes("less than") ? "text-cyan" : "text-amber"}`}
              >
                {nodeInfo.lastHeartbeatAtDistanceFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* COLLECTOR STATUS & SNAPSHOT STATUS */}
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="COLLECTOR STATUS"
            value={nodeInfo.collectorStatus}
            mono
            tone={`${COLLECTOR_STATUS_COLOR_TEXT[nodeInfo.collectorStatus] || ""} light:font-bold uppercase`}
            themeConfig="light:bg-background light:border-2 light:border-cyan/45 rounded"
          />
          <Stat
            label="SNAPSHOT STATUS"
            value={nodeInfo.status}
            mono
            tone={`${STATUS_COLOR_TEXT[nodeInfo.status] || ""} light:font-bold uppercase`}
            themeConfig="light:bg-background light:border-2 light:border-cyan/45 rounded"
            icon={
              <InfoTooltip
                content={
                  STATUS_EXPLANATIONS[nodeInfo.status] ||
                  "No explanation available"
                }
              />
            }
          />
        </div>

        {/* Memoized Static Sections - prevent re-renders when static values are identical */}
        <AssetIdentitySection
          primaryIpv4={nodeInfo.primaryIpv4}
          macAddress={nodeInfo.macAddress}
          hardwareSerial={nodeInfo.hardwareSerial}
          osProduct={nodeInfo.osProduct}
          model={nodeInfo.model}
          vendor={nodeInfo.vendor}
        />

        <HardwareSpecificationsSection
          motherboardModel={nodeInfo.motherboardModel}
          cpuModel={nodeInfo.cpuModel}
          arch={nodeInfo.arch}
          cpuArchitecture={nodeInfo.cpuArchitecture}
          logicalCpuCount={nodeInfo.logicalCpuCount}
          gpuModelPrimary={nodeInfo.gpuModelPrimary}
          ssdModelPrimary={nodeInfo.ssdModelPrimary}
          batteryModel={nodeInfo.batteryModel}
        />
      </div>
    </div>
  );
}
