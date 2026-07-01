"use client";

import { useMemo } from "react";
import { X, Network, Server, Cpu, Store } from "lucide-react";
import { useAssetStore } from "../hooks/useAssetStore";
import Stat from "@/components/common/stat";
import CopyableUserId from "@/components/common/copyable-user-id";

interface SiteDetailPanelProps {
  onClose: () => void;
}

export function SiteDetailPanel({ onClose }: SiteDetailPanelProps) {
  const { selectedSiteCode, topologyData } = useAssetStore();

  const siteTopology = useMemo(() => {
    if (!selectedSiteCode) return [];
    return topologyData.filter(
      (item) => item.rack.siteCode === selectedSiteCode,
    );
  }, [topologyData, selectedSiteCode]);

  const stats = useMemo(() => {
    const totalRacks = siteTopology.length;
    const totalNodes = siteTopology.reduce(
      (acc, item) => acc + (item.nodes?.length || 0),
      0,
    );

    const totalUsedSlots = totalNodes;
    const totalCapacityLimit = siteTopology.reduce(
      (acc, item) => acc + (item.rack.capacityLimit || 42),
      0,
    );

    const capacityPercent = totalCapacityLimit
      ? Math.round((totalUsedSlots / totalCapacityLimit) * 100)
      : 0;

    const rooms = Array.from(
      new Set(siteTopology.map((item) => item.rack.roomCode).filter(Boolean)),
    );

    return {
      totalRacks,
      totalNodes,
      totalCapacityLimit,
      capacityPercent,
      rooms,
    };
  }, [siteTopology]);

  if (!selectedSiteCode) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      <div className="glass relative h-full w-full max-w-md overflow-y-auto border-l border-cyan/20 p-6 pointer-events-auto bg-[#111827]/95 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="label-mono text-[10px] text-cyan-ice uppercase tracking-wider">
                SITE REGION PROFILE
              </div>
              <div className="title-display mt-1 text-lg text-foreground truncate max-w-[280px]">
                {selectedSiteCode || "UNASSIGNED SITE"}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="font-mono text-xs text-muted-foreground/60">
                  SITE CODE{": "}
                </div>
                <CopyableUserId value={selectedSiteCode} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-white/5 cursor-pointer"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Analytics Cards Grid */}
          <div className="grid grid-cols-3 gap-2">
            <Stat
              icon={<Server className="size-3 text-cyan-ice" />}
              label="RACKS"
              value={stats.totalRacks.toString()}
            />
            <Stat
              icon={<Cpu className="size-3 text-purple" />}
              label="NODES"
              value={stats.totalNodes.toString()}
            />
            <Stat
              icon={<Store className="size-3 text-emerald-400" />}
              label="CAPACITY"
              value={stats.totalCapacityLimit.toString()}
            />
          </div>

          {/* Capacity Profile Bar */}
          <div className="panel p-3 space-y-3">
            <div className="flex items-center justify-between font-bold text-xs text-muted-foreground">
              <span>U-SPACE USAGE</span>
              <span className="text-cyan text-sm">
                {stats.capacityPercent}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-[#0B1020] rounded-full overflow-hidden border border-[#25304A]">
              <div
                className="h-full bg-gradient-to-r from-cyan to-electric rounded-full transition-all duration-500"
                style={{ width: `${stats.capacityPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/85">
              <span>Used: {stats.totalNodes}U</span>
              <span>Limit: {stats.totalCapacityLimit}U</span>
            </div>
          </div>

          {/* Room Network Aggregations */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground border-b border-[#25304A]/70 pb-1">
              <Network className="size-3 text-cyan-ice" /> ROOM NETWORKS (
              {stats.rooms.length})
            </div>
            <div className="space-y-1.5">
              {stats.rooms.map((roomCode) => (
                <div
                  key={roomCode}
                  className="flex items-center justify-between panel p-3 text-xs hover:border-[#00D1FF]/40 hover:bg-cyan transition duration-200"
                >
                  <span className="font-mono text-foreground/90">
                    {roomCode}
                  </span>
                  <span className=" text-[11px] text-muted-foreground/70">
                    {
                      siteTopology.filter(
                        (item) => item.rack.roomCode === roomCode,
                      ).length
                    }{" "}
                    Rack(s)
                  </span>
                </div>
              ))}

              {stats.rooms.length === 0 && (
                <div className="text-center font-mono text-xs text-muted-foreground/70">
                  NO REGISTERED ROOM NETWORKS
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
