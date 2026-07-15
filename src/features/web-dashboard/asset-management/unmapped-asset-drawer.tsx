"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Layers, Cpu } from "lucide-react";
import { toast } from "sonner";
import {
  usePendingAssignmentNodesQuery,
  useTopologyTreeQuery,
} from "@/hooks/asset/use-asset-queries";
import {
  useRetireAndReplaceNodeMutation,
  useRetireAndReplaceRackMutation,
} from "@/hooks/asset/use-asset-mutations";
import { useAssetStore } from "./hooks/useAssetStore";
import { parseCoordinate } from "./lib/utils/parse-coordinate";
import { PendingAssignmentNodeView, RackEntity } from "@/types/assets";
import { LIFECYCLE_COLOR_TEXT } from "./lib/constant";

type DrawerRackItem = Omit<RackEntity, "metadata" | "capacityState"> & {
  type: "rack";
};

type DrawerNodeItem = Omit<
  PendingAssignmentNodeView,
  "lifecycleState" | "assignmentState"
> & {
  id: string; // Use nodeCode as unique identifier for nodes in the drawer
  type: "node";
};

type DrawerItem = DrawerRackItem | DrawerNodeItem;

export function UnmappedAssetsDrawer() {
  const { data: topology = [] } = useTopologyTreeQuery();
  const { data: pendingAssignmentNodes = [] } =
    usePendingAssignmentNodesQuery();

  const {
    selectedAsset,
    setSelectedAsset,
    isUnmappedDrawerOpen,
    setIsUnmappedDrawerOpen,
    setActivePanelType,
    draggedAsset,
    setDraggedAsset,
    setDragOverGridCell,
    setDragOverRackId,
    setConfirmMoveModalState,
  } = useAssetStore();

  const retireAndReplaceRackMutation = useRetireAndReplaceRackMutation();
  const retireAndReplaceNodeMutation = useRetireAndReplaceNodeMutation();

  // #region - handle rack and node data

  const unmappedRacks = useMemo(() => {
    return topology.filter((item) => {
      const rowVal = parseCoordinate(item.rack.rowCode);
      const colVal = parseCoordinate(item.rack.positionCode);
      const siteVal = parseCoordinate(item.rack.siteCode);
      const roomVal = parseCoordinate(item.rack.roomCode);
      return (
        rowVal === null ||
        colVal === null ||
        siteVal === null ||
        roomVal === null
      );
    });
  }, [topology]);

  const unifiedItems = useMemo<DrawerItem[]>(() => {
    const racksList: DrawerRackItem[] = unmappedRacks.map((r) => ({
      id: r.rack.id,
      rackCode: r.rack.rackCode,
      displayName: r.rack.displayName || r.rack.rackCode,
      siteCode: r.rack.siteCode || "N/A",
      roomCode: r.rack.roomCode || "N/A",
      rowCode: r.rack.rowCode || "N/A",
      positionCode: r.rack.positionCode || "N/A",
      lifecycleState: r.rack.lifecycleState,
      vendor: r.rack.vendor || "GENERIC",
      notes: r.rack.notes || "",
      capacityLimit: r.rack.capacityLimit,
      type: "rack" as const,
    }));

    const nodeList: DrawerNodeItem[] = pendingAssignmentNodes.map((node) => ({
      id: node.nodeCode,
      nodeCode: node.nodeCode,
      displayName: node.displayName || node.nodeCode,
      hostname: node.hostname || "N/A",
      nodeType: node.nodeType || "Server",
      source: node.source || "Unknown",
      origin: node.origin,
      discoveredNode: node.discoveredNode,
      type: "node" as const,
    }));

    return [...racksList, ...nodeList];
  }, [unmappedRacks, pendingAssignmentNodes]);

  // #endregion - handle rack and node data for the drawer

  // #region - handle drag and drop events

  const handleDragStart = (e: React.DragEvent, item: DrawerItem) => {
    setDraggedAsset({
      type: item.type,
      id: item.id,
      origin: "drawer",
    });
    e.dataTransfer.setData(
      "application/react-dnd",
      JSON.stringify({ type: item.type, id: item.id }),
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedAsset(null);
    setDragOverGridCell(null);
    setDragOverRackId(null);
  };

  const handleDropOnDrawer = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedAsset || draggedAsset.origin !== "canvas") return;

    const assetId = draggedAsset.id;
    const assetType = draggedAsset.type;

    if (assetType === "rack") {
      setConfirmMoveModalState({
        assetType: "rack",
        assetId,
        targetCoords: {
          siteCode: null,
          roomCode: null,
          rowCode: null,
          positionCode: null,
        },
        onConfirm: () => {
          retireAndReplaceRackMutation.mutate(
            { rackId: assetId },
            {
              onSuccess: () => {
                toast.success("Rack retired and returned to drawer");
              },
              onError: (err: Error) => {
                toast.error(err.message || "Failed to retire and replace Rack");
              },
            },
          );
        },
      });
    } else {
      setConfirmMoveModalState({
        assetType: "node",
        assetId,
        targetCoords: {
          siteCode: null,
          roomCode: null,
          rowCode: null,
          positionCode: null,
          rackId: null,
        },
        onConfirm: () => {
          retireAndReplaceNodeMutation.mutate(
            { nodeId: assetId },
            {
              onSuccess: () => {
                toast.success("Node retired and returned to drawer");
              },
              onError: (err: Error) => {
                toast.error(err.message || "Failed to retire Node");
              },
            },
          );
        },
      });
    }

    setDraggedAsset(null);
  };

  // #endregion - handle drag and drop events

  // #region - render section

  return (
    <div
      onDragOver={(e) => {
        if (draggedAsset?.origin === "canvas") {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={handleDropOnDrawer}
      className={`absolute bottom-0 left-0 right-0 z-30 bg-[#090f1d]/95 border-t border-cyan/20 backdrop-blur-xl transition-all duration-300 ${
        isUnmappedDrawerOpen ? "h-64" : "h-12"
      } ${draggedAsset?.origin === "canvas" ? "border-red-500/50 bg-red-950/20" : ""}`}
    >
      {/* Drawer Header */}
      <button
        onClick={() => {
          const nextOpen = !isUnmappedDrawerOpen;
          setIsUnmappedDrawerOpen(nextOpen);
          if (nextOpen) {
            setSelectedAsset(null);
            setActivePanelType(null);
          }
        }}
        className="w-full flex items-center justify-between px-6 h-11 border-b border-border/30 font-mono text-[13px] text-foreground hover:bg-white/2 cursor-pointer"
      >
        <div className="flex items-center gap-2 font-semibold">
          <span>UNMAPPED ASSETS</span>
          <span className="bg-cyan/10 border border-cyan/30 text-cyan rounded-full px-2 py-0.5 text-xs">
            {unifiedItems.length}
          </span>
          {draggedAsset?.origin === "canvas" && (
            <span className="text-[10px] text-red-400 animate-pulse font-bold ml-4">
              DROP HERE TO DE-ALLOCATE / RETIRE ASSET
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isUnmappedDrawerOpen ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronUp className="size-4" />
          )}
        </div>
      </button>

      {/* Drawer Content */}
      {isUnmappedDrawerOpen && (
        <div className="h-53.25 overflow-x-auto overflow-y-hidden flex items-center gap-5 p-5 custom-scrollbar-h bg-background/50 animate-fade-in">
          {unifiedItems.map((item) => {
            /* RACK ITEM Content */
            if (item.type === "rack") {
              const isSelected = selectedAsset?.id === item.id;

              return (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAsset(null);
                    } else {
                      setSelectedAsset({ id: item.id, assetType: "rack" });
                    }
                    setActivePanelType(null);
                  }}
                  className={`w-72 shrink-0 min-h-40 max-h-43 overflow-y-auto pr-1 custom-scrollbar rounded-xl border bg-[#0d152a]/90 pb-4 px-4 flex flex-col justify-between transition-all cursor-pointer hover:border-cyan hover:shadow-[0_0_15px_rgba(0,209,255,0.15)] active:scale-95 ${
                    isSelected
                      ? "border-cyan bg-cyan/5 shadow-[0_0_20px_rgba(0,209,255,0.2)] font-semibold"
                      : "border-border/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 border-b border-border/20 pt-4 pb-2 mb-2 sticky top-0 z-10 bg-[#0d152a]">
                      <Layers className="size-4 text-cyan" />
                      <span className="font-mono text-xs font-bold text-foreground truncate flex-1">
                        {item.displayName ?? item.rackCode ?? "N/A"}
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                      <div>
                        Code:{" "}
                        <span className="text-foreground font-semibold">
                          {item.rackCode ?? "N/A"}
                        </span>
                      </div>
                      <div>
                        Vendor:{" "}
                        <span className="text-foreground">{item.vendor}</span>
                      </div>
                      <div>
                        Capacity:{" "}
                        <span className="text-foreground">
                          {item.capacityLimit}U
                        </span>
                      </div>
                      <div>
                        Life State:{" "}
                        <span
                          className={`text-semibold ${LIFECYCLE_COLOR_TEXT[item.lifecycleState]}`}
                        >
                          {item.lifecycleState}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="truncate">
                          Notes:{" "}
                          <span className="text-foreground">{item.notes}</span>
                        </div>
                      )}
                      <div>
                        Location:{" "}
                        <span className="text-foreground">
                          {item.siteCode || "N/A"} · {item.roomCode || "N/A"} ·{" "}
                          {item.rowCode || "N/A"} · {item.positionCode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              /* NODE ITEM Content */
              const nodeItem = item as DrawerNodeItem;
              const isSelected = selectedAsset?.id === nodeItem.id;
              const isDiscovered = nodeItem.origin === "redis";

              return (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, nodeItem)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAsset(null);
                    } else {
                      setSelectedAsset({ id: nodeItem.id, assetType: "node" });
                    }
                    setActivePanelType(null);
                  }}
                  className={`w-72 shrink-0 min-h-40 max-h-43 overflow-y-auto pr-1 custom-scrollbar rounded-xl border bg-[#0d152a]/90 pb-4 px-4 flex flex-col justify-between transition-all cursor-pointer hover:border-cyan hover:shadow-[0_0_15px_rgba(0,209,255,0.15)] active:scale-95 ${
                    isSelected
                      ? "border-cyan bg-cyan/5 shadow-[0_0_20px_rgba(0,209,255,0.2)] font-semibold"
                      : "border-border/30"
                  }`}
                >
                  <div>
                    {/* header */}
                    <div className="flex items-center gap-2 border-b border-border/20 pt-4 pb-2 mb-2 sticky top-0 z-10 bg-[#0d152a]">
                      <Cpu
                        className={`size-4 ${isDiscovered ? "text-purple-400" : "text-emerald-400"}`}
                      />
                      <span className="font-mono text-xs font-bold text-foreground truncate flex-1">
                        {nodeItem.displayName}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          isDiscovered
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {isDiscovered ? "New Discovered" : "Available"}
                      </span>
                    </div>

                    {/* content */}
                    <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                      <div className="truncate">
                        Code:{" "}
                        <span className="text-foreground truncate font-mono font-semibold text-[9.5px]">
                          {nodeItem.nodeCode}
                        </span>
                      </div>
                      <div className="truncate">
                        Model:{" "}
                        <span className="text-foreground">
                          {nodeItem.discoveredNode?.hardware?.model || "N/A"}
                        </span>
                      </div>
                      <div className="truncate">
                        OS Product:{" "}
                        <span className="text-foreground">
                          {nodeItem.discoveredNode?.hardware?.osProduct ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="truncate">
                        Node type:{" "}
                        <span className="text-foreground/80 uppercase truncate font-mono font-semibold">
                          {nodeItem.nodeType}
                        </span>
                      </div>
                      <div>
                        IP Address:{" "}
                        <span className="text-foreground font-mono">
                          {nodeItem.discoveredNode?.hardware?.primaryIpv4 ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        MAC Address:{" "}
                        <span className="text-foreground font-mono">
                          {nodeItem.discoveredNode?.hardware?.macAddress ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="truncate">
                        Vendor:{" "}
                        <span className="text-foreground">
                          {nodeItem.discoveredNode?.hardware?.vendor || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );

  // #endregion - render section
}
