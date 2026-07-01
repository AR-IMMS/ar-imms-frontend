"use client";

import { useMemo } from "react";
import { Server } from "lucide-react";
import { RackTopologyResult } from "@/types/assets";
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

export interface RackCardProps {
  rackResult: RackTopologyResult;
  selectedRackId: string | null;
  selectedNodeId: string | null;
  onNodeSelect: (id: string | null) => void;
  onRackSelect?: (id: string | null) => void;
}

export function RackCard({
  rackResult,
  selectedRackId,
  selectedNodeId,
  onNodeSelect,
  onRackSelect,
}: RackCardProps) {
  const rack = rackResult.rack;
  const nodes = rackResult.nodes;

  // Filter & Sort nodes by slot number (e.g. U10 down to U01)
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const slotA = parseSlotNumber(a.positionCode);
      const slotB = parseSlotNumber(b.positionCode);
      return slotB - slotA; // Descending order (highest slot at top of rack card)
    });
  }, [nodes]);

  const isSelectedRack = selectedRackId === rack.id;

  return (
    <div
      id={`rack-card-${rack.id}`}
      onClick={() => onRackSelect?.(isSelectedRack ? null : rack.id)}
      className={`relative w-full rounded-2xl border p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:border-cyan/50 ${
        isSelectedRack
          ? "border-cyan/50 bg-accent/60"
          : "border-cyan/20 bg-accent/30"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5 gap-2">
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
        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
          {sortedNodes.map((node) => {
            const state = node.lifecycleState || "UNKNOWN";
            const color = LIFECYCLE_COLOR_DOT[state];
            const isSelected = selectedNodeId === node.id;

            return (
              <button
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeSelect(isSelected ? null : node.id);
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
      <div className="font-mono mt-3.5 border-t border-border/20 pt-2 flex items-center justify-between">
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
}
