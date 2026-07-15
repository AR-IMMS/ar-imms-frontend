"use client";

import { useMemo } from "react";
import { X, AlertTriangle, Cpu, StoreIcon, Edit, Power } from "lucide-react";
import { useAssetStore } from "../../hooks/useAssetStore";
import { CAPACITY_COLOR, LIFECYCLE_COLOR } from "../../lib/constant";
import Stat from "@/components/common/stat";
import CopyableUserId from "@/components/common/copyable-user-id";

interface RackDetailPanelProps {
  onClose: () => void;
}

export function RackDetailPanel({ onClose }: RackDetailPanelProps) {
  const {
    selectedAsset,
    topologyData,
    setSelectedAsset,
    setCreateEditRackModal,
    setLifecycleModalState,
    setDraggedAsset,
    setDragOverGridCell,
    setDragOverRackId,
  } = useAssetStore();

  const rackTopology = useMemo(() => {
    if (!selectedAsset || selectedAsset.assetType !== "rack") return null;
    return topologyData.find((item) => item.rack.id === selectedAsset.id);
  }, [topologyData, selectedAsset]);

  const unmappedNodes = useMemo(() => {
    if (!rackTopology?.nodes) return [];
    return rackTopology.nodes.filter((node) => !node.metadata?.markerCode);
  }, [rackTopology]);

  if (!rackTopology) return null;

  const { rack, nodes } = rackTopology;

  // #region - render section

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      <div className="glass relative h-full w-full max-w-md overflow-y-auto border-l border-cyan/20 p-6 pointer-events-auto bg-[#111827]/95 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="label-mono text-[10px] text-cyan-ice uppercase tracking-wider">
                RACK DETAIL PROFILE
              </div>
              <div className="title-display mt-1 text-lg text-foreground truncate max-w-70">
                {rack.displayName || rack.rackCode}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="font-mono text-xs text-muted-foreground/60">
                  RACK CODE{": "}
                </div>
                <CopyableUserId
                  value={rack.rackCode}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCreateEditRackModal({ isOpen: true, rackId: rack.id })
                }
                className="rounded p-1 hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-cyan transition"
                title="Edit Cabinet"
              >
                <Edit className="size-4" />
              </button>
              <button
                onClick={() =>
                  setLifecycleModalState({
                    entityType: "rack",
                    entityId: rack.id,
                    action:
                      rack.lifecycleState === "ACTIVE" ? "retire" : "activate",
                    displayName: rack.displayName || rack.rackCode,
                  })
                }
                className="rounded p-1 hover:bg-white/5 cursor-pointer text-muted-foreground hover:text-red-400 transition"
                title={
                  rack.lifecycleState === "ACTIVE"
                    ? "Retire Cabinet"
                    : "Activate Cabinet"
                }
              >
                <Power
                  className={`size-4 ${rack.lifecycleState === "ACTIVE" ? "text-red-400" : "text-emerald-400"}`}
                />
              </button>
              <button
                onClick={onClose}
                className="rounded p-1 hover:bg-white/5 cursor-pointer"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Physical Information */}
          <div className="panel p-3 space-y-3 flex flex-col">
            <div className="font-bold text-xs text-cyan-ice uppercase py-2">
              PHYSICAL INFORMATION
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Rack ID
                </div>
                <div className="text-xs font-semibold">
                  <CopyableUserId value={rack.id} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Location
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {rack.siteCode} · {rack.roomCode} · {rack.rowCode} ·{" "}
                  {rack.positionCode}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Vendor
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {rack.vendor || "GENERIC"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Capacity Limit
                </div>
                <div className="text-xs font-semibold text-foreground/80 truncate">
                  {rack.capacityLimit || "Undefined"}U
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Capacity State
                </div>
                {rack.capacityState ? (
                  <div
                    className={`text-xs font-semibold ${CAPACITY_COLOR[rack.capacityState]}`}
                  >
                    {rack.capacityState}
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-foreground/80 truncate">
                    Undefined
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Lifecycle State
                </div>
                {rack.lifecycleState ? (
                  <div
                    className={`text-xs font-semibold ${LIFECYCLE_COLOR[rack.lifecycleState]}`}
                  >
                    {rack.lifecycleState}
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-foreground/80 truncate">
                    Undefined
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-5">
                <div className="text-[11px] label-mono uppercase text-muted-foreground">
                  Note
                </div>
                <div className="text-xs font-semibold text-muted-foreground/80 text-end truncate">
                  {rack.notes || "No notes available"}
                </div>
              </div>
            </div>
          </div>

          {/* Active Node Matrix Breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <Stat
              icon={<Cpu className="size-3.5 text-purple" />}
              label="TOTAL NODES"
              value={`${nodes.length}`}
            />
            <Stat
              icon={<StoreIcon className="size-3.5 text-cyan" />}
              label="ACTIVE NODES"
              value={`${nodes.filter((node) => node.lifecycleState === "ACTIVE").length}`}
            />
            <Stat
              icon={<StoreIcon className="size-3.5 text-cyan" />}
              label="AVAILABLE SLOTS"
              value={`${rack.capacityLimit ? rack.capacityLimit - nodes.length : "N/A"}`}
            />
          </div>

          {/* Unmapped AR Nodes Summary List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between label-mono text-[10px] text-muted-foreground border-b border-[#25304A]/60 pb-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber" />
                <span>UNMAPPED AR NODES</span>
              </div>
              <span
                className={
                  unmappedNodes.length > 0
                    ? "text-[8px] border px-1.5 py-0.5 rounded uppercase font-bold tracking-wide text-amber"
                    : "text-[8px] border px-1.5 py-0.5 rounded uppercase font-bold tracking-wide text-neon-green"
                }
              >
                {unmappedNodes.length} WARNING(S)
              </span>
            </div>

            <div className="space-y-1.5">
              {unmappedNodes.map((node) => (
                <button
                  key={node.id}
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedAsset({
                      type: "node",
                      id: node.id,
                      origin: "canvas",
                    });
                    e.dataTransfer.setData(
                      "application/react-dnd",
                      JSON.stringify({ type: "node", id: node.id }),
                    );
                  }}
                  onDragEnd={() => {
                    setDraggedAsset(null);
                    setDragOverGridCell(null);
                    setDragOverRackId(null);
                  }}
                  onClick={() =>
                    setSelectedAsset({ id: node.id, assetType: "node" })
                  }
                  className="w-full flex items-center justify-between panel p-3 font-mono text-xs hover:border-cyan hover:bg-cyan/5 text-left transition duration-200 cursor-pointer pointer-events-auto active:scale-[0.98]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-foreground/90 font-medium truncate text-sm">
                      {node.displayName || node.nodeCode}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 truncate">
                      ID: {node.id} · SLOT: {node.positionCode || "U--"}
                    </div>
                  </div>
                  <span className="text-[8px] text-amber bg-amber/10 border border-amber/20 px-1 py-0.5 rounded shrink-0 uppercase tracking-widest font-bold">
                    NO MARKER
                  </span>
                </button>
              ))}

              {unmappedNodes.length === 0 && (
                <div className="text-center font-mono text-[9px] text-muted-foreground/45 py-6 bg-white/1 border border-[#25304A]/25 border-dashed rounded-lg">
                  ALL CABINET NODES MAPPED TO AR
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // #endregion - render section
}
