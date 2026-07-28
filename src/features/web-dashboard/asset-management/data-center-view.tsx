"use client";

import { useMemo, useRef, useEffect } from "react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { RackTopologyResult } from "@/types/assets";
import { useTopologyTreeQuery } from "@/hooks/asset/use-asset-queries";
import { useUpdateRackMutation } from "@/hooks/asset/use-asset-mutations";
import { useAssetStore } from "./hooks/useAssetStore";
import { RackCard } from "./components/rack-card";
import { CanvasBtn } from "@/components/common/canvas-btn";
import { parseCoordinate } from "./lib/utils/parse-coordinate";
import { SiteDetailPanel } from "./components/panel/site-detail-panel";
import { RackDetailPanel } from "./components/panel/rack-detail-panel";
import { NodeDetailPanel } from "./components/panel/node-detail-panel";

export function TopologyPage() {
  const { data: topology = [] } = useTopologyTreeQuery();

  const {
    selectedSiteCode,
    selectedRoomCode,
    selectedRackId,
    selectedNodeCode,
    setSelectedRackId,
    setSelectedNodeCode,
    activePanelType,
    setActivePanelType,

    // DND state
    draggedAsset,
    setDraggedAsset,
    dragOverGridCell,
    setDragOverGridCell,

    // Modal state controllers
    setConfirmMoveModalState,
  } = useAssetStore();

  const updateRackMutation = useUpdateRackMutation();

  const transformComponentRef = useRef<ReactZoomPanPinchRef>(null);

  // Focus viewport on selected rack or node rack automatically
  useEffect(() => {
    if (!transformComponentRef.current) return;

    if (selectedRackId) {
      setTimeout(() => {
        transformComponentRef.current?.zoomToElement(
          `rack-card-${selectedRackId}`,
          1.75,
          500,
          "easeOut",
          0,
          -125,
        );
      }, 100);
    }
  }, [selectedRackId, topology]);

  const activePanel = useMemo(() => {
    if (activePanelType === "node" && selectedNodeCode) {
      return (
        <NodeDetailPanel
          onClose={() => {
            setSelectedNodeCode(null);
            setActivePanelType(null);
          }}
        />
      );
    }
    if (activePanelType === "rack" && selectedRackId) {
      return (
        <RackDetailPanel
          onClose={() => {
            setSelectedNodeCode(null);
            setSelectedRackId(null);
            setActivePanelType(null);
          }}
        />
      );
    }
    if (activePanelType === "site" && selectedSiteCode) {
      return (
        <SiteDetailPanel
          onClose={() => {
            const { setSelectedSiteCode } = useAssetStore.getState();
            setSelectedSiteCode(null);
            setSelectedNodeCode(null);
            setSelectedRackId(null);
            setActivePanelType(null);
          }}
        />
      );
    }
    return null;
  }, [
    activePanelType,
    selectedNodeCode,
    selectedRackId,
    selectedSiteCode,
    setSelectedNodeCode,
    setSelectedRackId,
    setActivePanelType,
  ]);

  // Filter topology based on tree selections
  const filteredTopology = useMemo(() => {
    // Determine active room code based on selection or default to first rack's room code
    const activeRoomCode = selectedRoomCode ? selectedRoomCode : topology[0]?.rack.roomCode || null;

    return topology.filter((item) => {
      const site = item.rack.siteCode || "";
      const room = item.rack.roomCode || "";

      if (selectedSiteCode !== null && site !== selectedSiteCode) return false;
      if (activeRoomCode !== null && room !== activeRoomCode) return false;

      return true;
    });
  }, [topology, selectedSiteCode, selectedRoomCode]);

  // Separate into Placed (with Row/Position)
  const placedRacks = useMemo(() => {
    const placed: Array<{
      row: number;
      col: number;
      rackTopology: RackTopologyResult;
    }> = [];

    filteredTopology.forEach((item) => {
      const rowVal = parseCoordinate(item.rack.rowCode);
      const colVal = parseCoordinate(item.rack.positionCode);

      if (rowVal !== null && colVal !== null) {
        placed.push({
          row: rowVal,
          col: colVal,
          rackTopology: item,
        });
      }
    });

    return placed;
  }, [filteredTopology]);

  // Grid dimensions (rows, cols)
  const { maxRow, maxCol } = useMemo(() => {
    if (placedRacks.length === 0) return { maxRow: 2, maxCol: 4 };
    const rows = placedRacks.map((pr) => pr.row);
    const cols = placedRacks.map((pr) => pr.col);
    return {
      maxRow: Math.max(2, ...rows),
      maxCol: Math.max(4, ...cols),
    };
  }, [placedRacks]);

  // Handle dropping a rack onto an empty cell
  const handleRackDrop = (
    e: React.DragEvent,
    rowNum: number,
    colNum: number,
  ) => {
    e.preventDefault();
    if (!draggedAsset || draggedAsset.type !== "rack") return;

    const finalSiteCode =
      selectedSiteCode || filteredTopology[0]?.rack.siteCode || "UNDEFINED";
    const finalRoomCode =
      selectedRoomCode || filteredTopology[0]?.rack.roomCode || "UNDEFINED";

    const targetCoords = {
      siteCode: finalSiteCode,
      roomCode: finalRoomCode,
      rowCode: `ROW-${rowNum}`,
      positionCode: `P-${colNum}`,
    };

    setConfirmMoveModalState({
      assetType: "rack",
      assetId: null,
      targetCoords,
      onConfirm: () => {
        updateRackMutation.mutate(
          {
            rackId: draggedAsset.id,
            payload: {
              siteCode: finalSiteCode || "",
              roomCode: finalRoomCode || "",
              rowCode: `ROW-${rowNum}`,
              positionCode: `P-${colNum}`,
            },
          },
          {
            onSuccess: () => {
              toast.success("Rack relocated successfully");
            },
            onError: (err: Error) => {
              toast.error(err.message || "Failed to relocate Rack");
            },
          },
        );
      },
    });

    setDraggedAsset(null);
    setDragOverGridCell(null);
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex overflow-hidden rounded-2xl border border-border/10 relative">
      {/* Left/Main Spatial Canvas */}
      <div
        className={`flex-1 relative min-w-0 transition-all flex flex-col ${
          activePanelType ? "pr-112" : ""
        }`}
      >
        <div className="flex-1 min-h-0 relative">
          <TransformWrapper
            ref={transformComponentRef}
            initialScale={1}
            minScale={0.4}
            maxScale={2.0}
            centerOnInit={false}
            limitToBounds={false}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <main className="flex-1 relative overflow-hidden select-none outline-none cursor-grab active:cursor-grabbing w-full h-full">
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                  }}
                  contentStyle={{ width: "auto", height: "auto" }}
                >
                  {/* Viewport content */}
                  <div
                    className="p-24 origin-center"
                    style={{
                      display: "grid",
                      gridTemplateRows: `auto repeat(${maxRow}, minmax(380px, auto))`,
                      gridTemplateColumns: `auto repeat(${maxCol}, minmax(180px, auto))`,
                      gap: "1.5rem",
                    }}
                  >
                    {/* Intersection Cell (0,0) */}
                    <div className="size-12"></div>

                    {/* Column Coordinates Row */}
                    {Array.from({ length: maxCol }).map((_, cIdx) => (
                      <div
                        key={`col-head-${cIdx}`}
                        className="flex items-center justify-center font-mono text-[9px] text-cyan-ice/50 light:text-cyan-ice/80 bg-background/50 light:bg-secondary/20 border border-border/20 rounded px-4 py-2 select-none tracking-widest"
                      >
                        POS {cIdx + 1}
                      </div>
                    ))}

                    {/* Rows */}
                    {Array.from({ length: maxRow }).map((_, rIdx) => {
                      const rowNum = rIdx + 1;
                      return (
                        <div
                          key={`row-wrap-${rIdx}`}
                          style={{ display: "contents" }}
                        >
                          {/* Row Coordinator Label (Col 0) */}
                          <div className="flex items-center justify-center font-mono text-[9px] text-cyan-ice/70 light:text-cyan-ice/80 bg-background/50 light:bg-secondary/20 border border-border/20 rounded px-2 select-none tracking-widest">
                            ROW {rowNum}
                          </div>

                          {/* Cells inside Row */}
                          {Array.from({ length: maxCol }).map((_, cIdx) => {
                            const colNum = cIdx + 1;
                            const item = placedRacks.find(
                              (pr) => pr.row === rowNum && pr.col === colNum,
                            );

                            if (item) {
                              return (
                                <RackCard
                                  key={item.rackTopology.rack.id}
                                  rackResult={item.rackTopology}
                                />
                              );
                            }

                            // Empty Holographic Blueprint Cell
                            const isCellDragOver =
                              dragOverGridCell?.row === rowNum &&
                              dragOverGridCell?.col === colNum;

                            return (
                              <div
                                key={`empty-${rowNum}-${colNum}`}
                                onDragOver={(e) => {
                                  if (draggedAsset?.type === "rack") {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (
                                      dragOverGridCell?.row !== rowNum ||
                                      dragOverGridCell?.col !== colNum
                                    ) {
                                      setDragOverGridCell({
                                        row: rowNum,
                                        col: colNum,
                                      });
                                    }
                                  }
                                }}
                                onDragLeave={() => {
                                  if (
                                    dragOverGridCell?.row === rowNum &&
                                    dragOverGridCell?.col === colNum
                                  ) {
                                    setDragOverGridCell(null);
                                  }
                                }}
                                onDrop={(e) =>
                                  handleRackDrop(e, rowNum, colNum)
                                }
                                className={`border rounded-2xl flex flex-col items-center justify-center p-8 transition-colors select-none ${
                                  isCellDragOver
                                    ? "border-cyan bg-cyan/5 shadow-[0_0_12px_rgba(0,209,255,0.6)] border-solid"
                                    : "border-dashed border-border/10 bg-background/20 light:bg-secondary/15 hover:bg-foreground/3 hover:light:bg-secondary/30"
                                }`}
                              >
                                <div className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                                  FREE SPACE
                                </div>
                                <div className="font-mono text-[8px] text-muted-foreground/40 mt-1">
                                  R{rowNum}-P{colNum}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </TransformComponent>

                {/* Floating Canvas Controls */}
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                  <CanvasBtn
                    onClick={() => zoomIn()}
                    I={ZoomIn}
                    label="Zoom In"
                  />
                  <CanvasBtn
                    onClick={() => zoomOut()}
                    I={ZoomOut}
                    label="Zoom Out"
                  />
                  <CanvasBtn
                    onClick={() => resetTransform()}
                    I={RotateCcw}
                    label="Reset Zoom"
                  />
                </div>
              </main>
            )}
          </TransformWrapper>
        </div>
      </div>

      {/* Right details panel overlay */}
      {activePanel}
    </div>
  );
}
