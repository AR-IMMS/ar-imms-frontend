"use client";

import { useMemo } from "react";
import { X, MapPin, QrCode, Monitor, CpuIcon } from "lucide-react";
import { useAssetStore } from "../hooks/useAssetStore";
import { useNodeContextQuery } from "@/hooks/asset/use-asset-queries";
import {
  ASSIGNMENT_COLOR_TEXT,
  LIFECYCLE_COLOR,
  LIFECYCLE_COLOR_TEXT,
} from "../lib/constant";
import { MarkerEntity } from "@/types/assets";
import Stat from "@/components/common/stat";
import CopyableUserId from "@/components/common/copyable-user-id";

interface NodeDetailPanelProps {
  onClose: () => void;
}

interface DiscoveredNodeMetadata {
  discoveredNode?: {
    agentId?: string;
    source?: string | null;
    hardware?: {
      primaryIpv4?: string;
      macAddress?: string;
      hardwareSerial?: string;
      osProduct?: string;
      logicalCpuCount?: number;
      cpuArchitecture?: string;
      vendor?: string;
      model?: string;
    };
    registeredAt?: string;
  };
}

export function NodeDetailPanel({ onClose }: NodeDetailPanelProps) {
  const { selectedNodeId } = useAssetStore();

  const { data: context, isLoading } = useNodeContextQuery(
    selectedNodeId || "",
    !!selectedNodeId,
  );

  const nodeInfo = useMemo(() => {
    if (!context) return null;
    const { node, rack, markers } = context;
    const meta = node.metadata as unknown as DiscoveredNodeMetadata;
    const metaDisc = meta?.discoveredNode;

    const ipAddr =
      node.managementIp || metaDisc?.hardware?.primaryIpv4 || "N/A";
    const macAddr = metaDisc?.hardware?.macAddress || "N/A";
    const serialNum =
      node.serialNumber || metaDisc?.hardware?.hardwareSerial || "N/A";
    const vendorName = node.vendor || metaDisc?.hardware?.vendor || "GENERIC";
    const modelName = node.model || metaDisc?.hardware?.model || "GENERIC";
    const osProduct = metaDisc?.hardware?.osProduct || "N/A";
    const cpuCount = metaDisc?.hardware?.logicalCpuCount || 0;
    const cpuArch = metaDisc?.hardware?.cpuArchitecture || "N/A";

    return {
      id: node.id,
      nodeCode: node.nodeCode,
      displayName: node.displayName || node.nodeCode,
      hostname: node.hostname || "N/A",
      nodeType: node.nodeType || "Server",
      source: node.source || metaDisc?.source || "N/A",
      lifecycleState: node.lifecycleState,
      assignmentState: node.assignmentState,
      notes: node.notes || "No notes available",
      rackId: rack?.id || "N/A",
      positionCode: node.positionCode || "N/A",
      siteCode: rack?.siteCode || "Unassigned Site",
      roomCode: rack?.roomCode || "Unknown Room",
      rowCode: rack?.rowCode || "Unknown Row",
      rackPositionCode: rack?.positionCode || "Unknown Position",
      ip: ipAddr,
      mac: macAddr,
      serial: serialNum,
      vendor: vendorName,
      model: modelName,
      os: osProduct,
      cpus: cpuCount,
      arch: cpuArch,
      markers: markers || [],
    };
  }, [context]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
        <div className="glass relative h-full w-full max-w-md overflow-y-auto border-l border-cyan/20 p-6 pointer-events-auto bg-[#111827]/95 animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-1/3" />
          <div className="h-12 bg-white/5 rounded w-full" />
          <div className="h-32 bg-white/5 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!nodeInfo) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      <div className="glass relative h-full w-full max-w-md overflow-y-auto border-l border-cyan/20 p-6 pointer-events-auto bg-[#111827]/95 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="label-mono text-[10px] text-cyan-ice uppercase tracking-wider">
                NODE DETAIL PROFILE
              </div>
              <div className="title-display mt-1 text-lg text-foreground truncate max-w-[280px]">
                {nodeInfo.displayName}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="font-mono text-xs text-muted-foreground/60">
                  NODE CODE{": "}
                </div>
                <CopyableUserId
                  value={nodeInfo.nodeCode}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-white/5 cursor-pointer"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Section 1: Business & Coordinates */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 label-mono text-[11px] text-muted-foreground border-b border-[#25304A]/60 pb-1">
              <MapPin className="size-3 text-cyan-ice" /> PHYSICAL PLACEMENT &
              CONTEXT
            </div>

            {/* business information */}
            <div className="panel p-3 space-y-2.5 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  NODE ID
                </div>
                <div className="text-xs font-semibold">
                  <CopyableUserId value={nodeInfo.id} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  ASSIGNED RACK ID
                </div>
                <div className="text-xs font-semibold">
                  <CopyableUserId value={nodeInfo.rackId} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  NODE TYPE
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {nodeInfo.nodeType}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  HOSTNAME
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {nodeInfo.hostname || "N/A"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  SOURCE
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {nodeInfo.source}
                </div>
              </div>

              <div className="flex items-center justify-between gap-10">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  NOTE
                </div>
                <div
                  className="text-xs text-foreground/60 text-end truncate tooltip-text"
                  title={nodeInfo.notes}
                >
                  {nodeInfo.notes}
                </div>
              </div>
            </div>

            {/* location & network information */}
            <Stat
              label="LOCATION NETWORKS"
              value={`${nodeInfo.siteCode} · ${nodeInfo.roomCode} · ${nodeInfo.rowCode} · ${nodeInfo.rackPositionCode} · ${nodeInfo.positionCode}`}
              mono
            />

            {/* state */}
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="LIFECYCLE STATE"
                value={nodeInfo.lifecycleState}
                mono
                tone={`${LIFECYCLE_COLOR_TEXT[nodeInfo.lifecycleState]}`}
              />
              <Stat
                label="ASSIGNMENT STATE"
                value={nodeInfo.assignmentState}
                mono
                tone={`${ASSIGNMENT_COLOR_TEXT[nodeInfo.assignmentState]}`}
              />
            </div>
          </div>

          {/* Section 2: Hardware Blueprint */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 label-mono text-[11px] text-muted-foreground border-b border-[#25304A]/60 pb-1">
              <Monitor className="size-3 text-cyan-ice" /> HARDWARE
              SPECIFICATIONS
            </div>

            {/* hardware information */}
            <div className="panel p-3 space-y-2.5 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  Serial Number
                </div>
                <div className="text-xs font-semibold">
                  <CopyableUserId value={nodeInfo.serial} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  Primary IP
                </div>
                <div className="text-xs font-semibold">
                  <CopyableUserId value={nodeInfo.ip} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  MAC ADDRESS
                </div>
                <div className="text-xs font-semibold">
                  <CopyableUserId value={nodeInfo.mac} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  PLATFORM OS
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {nodeInfo.os}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  MODEL
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {nodeInfo.model}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="label-mono uppercase text-[11px] text-muted-foreground">
                  VENDOR
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {nodeInfo.vendor}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                icon={<CpuIcon className="size-3.5 text-purple" />}
                label="CPU ARCHITECTURE"
                value={nodeInfo.arch.toUpperCase()}
                mono
              />
              <Stat
              icon={<CpuIcon className="size-3.5 text-purple" />}
                label="CPU LOGICAL CORES"
                value={nodeInfo.cpus.toString()}
                mono
              />
            </div>
          </div>

          {/* Section 3: AR Marker Topology Mapping */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 label-mono text-[11px] text-muted-foreground border-b border-[#25304A]/60 pb-1">
              <QrCode className="size-3.5 text-cyan-ice" /> AR SPATIAL TRACKING
              MARKERS
            </div>

            <div className="space-y-2">
              {nodeInfo.markers.map((marker: MarkerEntity) => (
                <div
                  key={marker.id}
                  className="panel p-3 space-y-3 font-mono text-[10px]"
                >
                  <div className="flex items-center justify-between border-b border-[#25304A]/50 pb-2">
                    <span className="text-cyan font-bold font-mono text-sm">
                      {marker.markerCode}
                    </span>
                    <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-400 border-emerald-500/25 uppercase tracking-wider">
                      {marker.lifecycleState}
                    </span>
                  </div>
                  <div className="space-y-2 text-[9.5px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/60">LABEL:</span>
                      <span className="text-foreground">
                        {marker.displayLabel || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/60">
                        BINDING STATUS:
                      </span>
                      <span className="text-foreground uppercase">
                        {marker.bindingStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/60">
                        AR WORLD TRACKING:
                      </span>
                      <span className="text-foreground">
                        {marker.worldTrackingEnabled
                          ? "ENABLED (SLAM)"
                          : "DISABLED"}
                      </span>
                    </div>
                    {marker.lastValidatedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60">
                          CALIBRATION DATE:
                        </span>
                        <span className="text-foreground text-[9px]">
                          {new Date(marker.lastValidatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {marker.notes && (
                      <div className="pt-1.5 border-t border-[#25304A]/40 text-muted-foreground/80 leading-relaxed">
                        Calibration note: {marker.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {nodeInfo.markers.length === 0 && (
                <div className="text-center font-mono text-[11px] text-muted-foreground/55 py-6 border border-[#25304A]/25 border-dashed rounded-lg flex flex-col items-center gap-2">
                  <AlertSquareIcon className="size-4 text-amber/60" />
                  <span>NO ACTIVE SPATIAL MARKERS ATTACHED</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
