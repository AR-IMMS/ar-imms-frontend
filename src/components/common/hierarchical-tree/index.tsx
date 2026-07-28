"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { useUiConfigStore } from "@/stores/ui-config-store";
import { useTopologyTreeQuery } from "@/hooks/asset/use-asset-queries";
import { HierarchicalTreeProps, SiteGroup } from "./types";
import { SiteItem } from "./SiteItem";

export default function HierarchicalTree({
  maxLevel = "node",
  searchPlaceholder = "Search...",
  containerClassName = "relative h-full flex flex-col select-none",
  panelClassName = "",
  emptyStateText = "No assets match filters",
}: HierarchicalTreeProps) {
  const { data: topology = [], isLoading } = useTopologyTreeQuery();
  const {
    isTopologyTreeCollapsed,
    toggleTopologyTree,
    setTopologyTreeCollapsed,
  } = useUiConfigStore();

  const selectedSiteCode = useAssetStore((s) => s.selectedSiteCode);
  const selectedRoomCode = useAssetStore((s) => s.selectedRoomCode);
  const selectedRackId = useAssetStore((s) => s.selectedRackId);
  const selectedNodeCode = useAssetStore((s) => s.selectedNodeCode);

  const resetFilters = useAssetStore((s) => s.resetFilters);
  const setSelectedSiteCode = useAssetStore((s) => s.setSelectedSiteCode);
  const setSelectedRoomCode = useAssetStore((s) => s.setSelectedRoomCode);
  const setSelectedRackId = useAssetStore((s) => s.setSelectedRackId);

  // Clear selections when switching features (unmounting)
  useEffect(() => {
    return () => {
      resetFilters();
    };
  }, [resetFilters]);

  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});

  // Auto-expand tree path when Zustand selection state changes
  useEffect(() => {
    if (topology.length === 0) return;

    let activeTimer: NodeJS.Timeout | null = null;

    const targetSiteCode = selectedSiteCode;
    const targetRoomCode = selectedRoomCode;
    const targetRackId = selectedRackId;

    if (targetSiteCode) {
      const siteKey = targetSiteCode || "unassigned-site";
      const roomKey = `${siteKey}/${targetRoomCode || "unknown-room"}`;
      const rackKey = `${roomKey}/${targetRackId}`;

      activeTimer = setTimeout(() => {
        setOpenNodes((prev) => {
          const updates: Record<string, boolean> = {};
          let changed = false;

          if (!prev[siteKey]) {
            updates[siteKey] = true;
            changed = true;
          }
          if (targetRoomCode && !prev[roomKey]) {
            updates[roomKey] = true;
            changed = true;
          }
          if (targetRackId && !prev[rackKey]) {
            updates[rackKey] = true;
            changed = true;
          }

          if (changed) {
            return { ...prev, ...updates };
          }
          return prev;
        });
      }, 0);
    }

    return () => {
      if (activeTimer) clearTimeout(activeTimer);
    };
  }, [
    selectedSiteCode,
    selectedRoomCode,
    selectedRackId,
    selectedNodeCode,
    topology,
    setSelectedSiteCode,
    setSelectedRoomCode,
    setSelectedRackId,
  ]);

  // Expand toggles
  const toggleSite = (siteKey: string) => {
    setOpenNodes((o) => ({ ...o, [siteKey]: !o[siteKey] }));
  };

  const toggleRoom = (roomKey: string) => {
    setOpenNodes((o) => ({ ...o, [roomKey]: !o[roomKey] }));
  };

  const toggleRack = (rackKey: string) => {
    setOpenNodes((o) => ({ ...o, [rackKey]: !o[rackKey] }));
  };

  // Aggregation logic
  const treeData = useMemo(() => {
    const sites: Record<string, SiteGroup> = {};

    topology.forEach((item) => {
      const sCode = item.rack.siteCode ? item.rack.siteCode.trim() : "";
      const rCode = item.rack.roomCode ? item.rack.roomCode.trim() : "";

      if (!sCode && !rCode) return;

      const siteKey = sCode || "unassigned-site";
      const roomKey = rCode || "unknown-room";
      const siteName = sCode || "Unassigned Site";
      const roomName = rCode || "Unknown Room";

      if (!sites[siteKey]) {
        sites[siteKey] = {
          siteCode: sCode,
          displayName: siteName,
          rooms: {},
        };
      }

      if (!sites[siteKey].rooms[roomKey]) {
        sites[siteKey].rooms[roomKey] = {
          roomCode: rCode,
          displayName: roomName,
          racks: [],
        };
      }

      sites[siteKey].rooms[roomKey].racks.push({
        id: item.rack.id,
        rackCode: item.rack.rackCode,
        displayName: item.rack.displayName || item.rack.rackCode,
        nodes: item.nodes.map((n) => ({
          id: n.id,
          nodeCode: n.nodeCode,
          displayName: n.displayName || n.nodeCode,
        })),
      });
    });

    return Object.values(sites);
  }, [topology]);

  if (isLoading) {
    return (
      <div className={containerClassName}>
        <div
          className={`panel p-4 space-y-4 h-full flex flex-col overflow-hidden animate-pulse ${panelClassName}`}
        >
          <div className="h-9 rounded-md bg-white/5 border border-border/20 shrink-0" />
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 bg-white/5 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {/* Sidebar Panel */}
      <div
        className={`panel p-4 space-y-4 h-full flex flex-col overflow-hidden transition-all duration-300 ${panelClassName} ${
          isTopologyTreeCollapsed
            ? "w-0 p-0 border-none opacity-0 pointer-events-none scale-95 -translate-x-4"
            : "opacity-100 scale-100 translate-x-0"
        }`}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-2 h-9 rounded-md bg-surface-1 border border-border shrink-0">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent outline-none text-xs font-mono placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Tree List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 font-mono text-xs pr-1">
          {treeData.length === 0 ? (
            <div className="text-center text-muted-foreground/50 py-8 text-[11px]">
              {emptyStateText}
            </div>
          ) : (
            treeData.map((site) => {
              const siteKey = site.siteCode || "unassigned-site";
              const siteOpen = !!openNodes[siteKey];

              return (
                <SiteItem
                  key={siteKey}
                  site={site}
                  maxLevel={maxLevel}
                  siteKey={siteKey}
                  siteOpen={siteOpen}
                  toggleSite={toggleSite}
                  openNodes={openNodes}
                  toggleRoom={toggleRoom}
                  toggleRack={toggleRack}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={toggleTopologyTree}
        className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center size-6 rounded-full bg-accent border border-accent-foreground/30 text-accent-foreground hover:border-cyan-400 hover:bg-cyan/30 transition duration-200 cursor-pointer ${
          isTopologyTreeCollapsed ? "" : "-right-3"
        }`}
        title={
          isTopologyTreeCollapsed
            ? "Expand Tree Sidebar"
            : "Collapse Tree Sidebar"
        }
      >
        {isTopologyTreeCollapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>

      {/* Micro-trigger zone when collapsed */}
      {isTopologyTreeCollapsed && (
        <div
          onClick={() => setTopologyTreeCollapsed(false)}
          className="absolute inset-y-0 right-0 w-4 cursor-pointer"
        />
      )}
    </div>
  );
}
