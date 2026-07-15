"use client";

import { useMemo } from "react";
import { Server } from "lucide-react";
import { RackTopologyResult } from "@/types/assets";
import { useAssetStore } from "../hooks/useAssetStore";
import {
  LIFECYCLE_COLOR,
  LIFECYCLE_COLOR_DOT,
  LIFECYCLE_COLOR_BORDER,
} from "../lib/constant";

// Parses slot number from Uxx (e.g. U05 -> 5)
function parseSlotNumber(posCode: string | undefined | null): number {
  if (!posCode) return 0;
  const match = posCode.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

interface RackCardProps {
  rackResult: RackTopologyResult;
}

export function RackCard({ rackResult }: RackCardProps) {
  const rack = rackResult.rack;
  const nodes = rackResult.nodes;

  const {
    selectedAsset,
    setSelectedAsset,
    draggedAsset,
    setDraggedAsset,
    dragOverRackId,
    setDragOverRackId,
    setIsUnmappedDrawerOpen,
    setActivePanelType,
    setAssignNodeModalState,
    setDragOverGridCell,
  } = useAssetStore();

  // Filter & Sort nodes by slot number (e.g. U10 down to U01)
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const slotA = parseSlotNumber(a.positionCode);
      const slotB = parseSlotNumber(b.positionCode);
      return slotB - slotA; // Descending order (highest slot at top of rack card)
    });
  }, [nodes]);

  const isSelectedRack =
    selectedAsset?.id === rack.id && selectedAsset?.assetType === "rack";
  const isDragOver = dragOverRackId === rack.id;

  // #region - handle drag and drop events

  const handleAssetDragStart = (
    e: React.DragEvent,
    assetId: string,
    assetType: "rack" | "node",
  ) => {
    if (assetType === "node") {
      e.stopPropagation();
    }
    setDraggedAsset({
      type: assetType,
      id: assetId,
      origin: "canvas",
    });
    e.dataTransfer.setData(
      "application/react-dnd",
      JSON.stringify({ type: assetType, id: assetId }),
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedAsset(null);
    setDragOverGridCell(null);
    setDragOverRackId(null);
  };

  // drag node inside the same rack - reposition slot
  const handleDragOver = (e: React.DragEvent) => {
    if (draggedAsset?.type === "node") {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverRackId !== rack.id) {
        setDragOverRackId(rack.id);
      }
    }
  };

  // drag node to a new rack - reposition location
  const handleDragLeave = () => {
    if (dragOverRackId === rack.id) {
      setDragOverRackId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedAsset || draggedAsset.type !== "node") return;

    // Trigger offset assignment modal
    setAssignNodeModalState({
      nodeId: draggedAsset.id,
      rackId: rack.id,
    });

    setDraggedAsset(null);
    setDragOverRackId(null);
  };

  // #endregion - handle drag and drop events

  // #region - render section

  return (
    <div
      id={`rack-card-${rack.id}`}
      draggable={true}
      onDragStart={(e) => handleAssetDragStart(e, rack.id, "rack")}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (isSelectedRack) {
          setSelectedAsset(null);
          setActivePanelType(null);
        } else {
          setSelectedAsset({ id: rack.id, assetType: "rack" });
          setIsUnmappedDrawerOpen(false);
          setActivePanelType("rack");
        }
      }}
      className={`relative w-full rounded-2xl border p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:border-cyan/50 active:scale-99 ${
        isDragOver
          ? "border-cyan bg-cyan/5 shadow-[0_0_12px_rgba(0,209,255,0.6)]"
          : isSelectedRack
            ? "border-cyan/50 bg-accent/60"
            : "border-cyan/20 bg-accent/30"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5 gap-2 select-none">
          <div className="flex flex-col">
            <span className="text-xs text-[11px] font-bold text-foreground truncate uppercase">
              {rack.displayName || rack.rackCode}
            </span>
            <span className="text-xs text-[8px] text-muted-foreground">
              Capacity:{" "}
              <span className="text-cyan-ice/70 font-bold">
                {nodes.length}/{rack.capacityLimit || 42}U
              </span>
            </span>
          </div>
          <Server className="flex items-end shrink-0 h-3.5 w-3.5 text-cyan-ice/75" />
        </div>

        {/* Nodes slot list */}
        <div className="space-y-1 max-h-70 overflow-y-auto custom-scrollbar pr-0.5">
          {sortedNodes.map((node) => {
            const state = node.lifecycleState || "UNKNOWN";
            const color = LIFECYCLE_COLOR_DOT[state];
            const isSelected =
              selectedAsset?.id === node.id &&
              selectedAsset?.assetType === "node";

            return (
              <button
                key={node.id}
                draggable={true}
                onDragStart={(e) => handleAssetDragStart(e, node.id, "node")}
                onDragEnd={handleDragEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSelected) {
                    setSelectedAsset(null);
                    setActivePanelType(null);
                  } else {
                    setSelectedAsset({ id: node.id, assetType: "node" });
                    setIsUnmappedDrawerOpen(false);
                    setActivePanelType("node");
                  }
                }}
                className={`relative flex w-full items-center gap-2 rounded bg-accent/70 border-l-3 ${LIFECYCLE_COLOR_BORDER[state]} hover:bg-cyan/10 px-2 py-1 text-left transition-all hover:border-cyan/40 cursor-pointer ${
                  isSelected ? "bg-cyan/20" : ""
                }`}
              >
                {/* Health Dot */}
                <span
                  className={`h-1 w-1 shrink-0 rounded-full animate-pulse ${color}`}
                />

                {/* Node name */}
                <span className="font-mono grow truncate text-[9px] text-foreground/80">
                  {node.displayName || node.nodeCode}
                </span>

                {/* Slot/Unit label */}
                <span className="font-mono text-[7.5px] text-muted-foreground/70 shrink-0">
                  {node.positionCode || "U--"}
                </span>
              </button>
            );
          })}

          {/* Empty indicator */}
          {nodes.length === 0 && (
            <div className="text-center py-6 font-mono text-[9px] text-muted-foreground/30">
              NO ASSETS ASSIGNED
            </div>
          )}
        </div>
      </div>

      {/* Bottom specs */}
      <div className="font-mono mt-3.5 border-t border-border/20 pt-2 flex items-center justify-between select-none">
        <span className="flex items-center gap-1.5 text-[8.5px] text-muted-foreground/70">
          {rack.siteCode}·{rack.roomCode}
        </span>
        <span
          className={`px-1.5 py-0.5 border rounded-[3px] text-[7.5px] font-bold ${
            LIFECYCLE_COLOR[rack.lifecycleState]
          }`}
        >
          {rack.lifecycleState}
        </span>
      </div>
    </div>
  );

  // #endregion - render section
}
