"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useTopologyTreeQuery,
  usePendingAssignmentNodesQuery,
} from "@/hooks/asset/use-asset-queries";
import { useAssetStore } from "../hooks/useAssetStore";
import { matchesPendingAssignmentNode } from "../lib/utils/pending-assignment";
import {
  ChevronRight,
  ChevronDown,
  Search,
  MapPin,
  Layers,
  Server,
} from "lucide-react";

interface RackLeaf {
  id: string;
  rackCode: string;
  displayName: string;
}

interface RoomGroup {
  roomCode: string;
  displayName: string;
  racks: RackLeaf[];
}

interface SiteGroup {
  siteCode: string;
  displayName: string;
  rooms: Record<string, RoomGroup>;
}

export default function HierarchicalTreeSidebar() {
  const { data: topology, isLoading, isError } = useTopologyTreeQuery();
  const { data: pendingAssignmentNodes = [] } = usePendingAssignmentNodesQuery();

  const {
    selectedSiteCode,
    selectedRoomCode,
    selectedAsset,
    searchQuery,
    setSelectedSiteCode,
    setSelectedRoomCode,
    setSelectedAsset,
    setSearchQuery,
    setTopologyData,
    setLoadingState,
    setErrorState,
    setIsUnmappedDrawerOpen,
    setActivePanelType,
    resetFilters,
  } = useAssetStore();

  const [openSites, setOpenSites] = useState<Record<string, boolean>>({});
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>({});

  // Sync React Query data & states to Zustand store
  useEffect(() => {
    if (topology) {
      setTopologyData(topology);
    }
  }, [topology, setTopologyData]);

  useEffect(() => {
    setLoadingState("topology", isLoading);
  }, [isLoading, setLoadingState]);

  useEffect(() => {
    setErrorState("topology", isError);
  }, [isError, setErrorState]);

  // Synchronized active highlighting and autoscroll search processing
  useEffect(() => {
    if (!searchQuery) return;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    // 1. Search in ASSIGNED topology (data-center-view)
    if (topology) {
      const matchedAssigned = topology.find((item) => {
        // Must have rowCode/positionCode/siteCode/roomCode to be considered placed on canvas
        const isPlaced =
          item.rack.siteCode &&
          item.rack.roomCode &&
          item.rack.rowCode &&
          item.rack.positionCode;
        if (!isPlaced) return false;

        const rackMatch =
          item.rack.rackCode.toLowerCase().includes(q) ||
          (item.rack.displayName &&
            item.rack.displayName.toLowerCase().includes(q));

        const nodeMatch = item.nodes.some(
          (node) =>
            node.nodeCode.toLowerCase().includes(q) ||
            (node.displayName && node.displayName.toLowerCase().includes(q)) ||
            (node.managementIp && node.managementIp.toLowerCase().includes(q)),
        );

        return rackMatch || nodeMatch;
      });

      if (matchedAssigned) {
        setSelectedSiteCode(matchedAssigned.rack.siteCode || "");
        setSelectedRoomCode(matchedAssigned.rack.roomCode || "");

        const matchedNode = matchedAssigned.nodes.find(
          (node) =>
            node.nodeCode.toLowerCase().includes(q) ||
            (node.displayName && node.displayName.toLowerCase().includes(q)) ||
            (node.managementIp && node.managementIp.toLowerCase().includes(q)),
        );

        if (matchedNode) {
          setSelectedAsset({ id: matchedNode.id, assetType: "node" });
          setSelectedAsset({ id: matchedAssigned.rack.id, assetType: "rack" });
          setActivePanelType("node");
        } else {
          setSelectedAsset({ id: matchedAssigned.rack.id, assetType: "rack" });
          setSelectedAsset(null);
          setActivePanelType("rack");
        }

        setIsUnmappedDrawerOpen(false);
        return; // Found assigned match, stop checking
      }
    }

    // 2. Search in pending-assignment nodes inside drawer
    const matchedPendingNode = pendingAssignmentNodes.find((node) =>
      matchesPendingAssignmentNode(node, q),
    );

    if (matchedPendingNode) {
      setSelectedSiteCode(null);
      setSelectedRoomCode(null);
      setSelectedAsset(null);
      setSelectedAsset({ id: matchedPendingNode.nodeCode, assetType: "node" });
      setIsUnmappedDrawerOpen(true);
      setActivePanelType(null); // Drawer items should not open detail panel
      return;
    }

    // 3. Search in UNMAPPED Racks inside drawer
    if (topology) {
      const matchedUnmapped = topology.find((item) => {
        // Placed check
        const isPlaced =
          item.rack.siteCode &&
          item.rack.roomCode &&
          item.rack.rowCode &&
          item.rack.positionCode;
        if (isPlaced) return false;

        return (
          item.rack.rackCode.toLowerCase().includes(q) ||
          (item.rack.displayName &&
            item.rack.displayName.toLowerCase().includes(q))
        );
      });

      if (matchedUnmapped) {
        setSelectedSiteCode(null);
        setSelectedRoomCode(null);
        setSelectedAsset(null);
        setSelectedAsset({ id: matchedUnmapped.rack.id, assetType: "rack" });
        setIsUnmappedDrawerOpen(true);
        setActivePanelType(null); // Drawer items should not open detail panel
        return;
      }
    }
  }, [
    searchQuery,
    topology,
    pendingAssignmentNodes,
    setSelectedSiteCode,
    setSelectedRoomCode,
    setSelectedAsset,
    setIsUnmappedDrawerOpen,
    setActivePanelType,
  ]);

  // Search filter: Match racks or their nodes by code, name, or IP
  const filteredRacks = useMemo(() => {
    if (!topology) return [];
    if (!searchQuery) return topology;
    const q = searchQuery.toLowerCase().trim();
    return topology.filter((item) => {
      const rackMatch =
        item.rack.rackCode.toLowerCase().includes(q) ||
        (item.rack.displayName &&
          item.rack.displayName.toLowerCase().includes(q)) ||
        (item.rack.siteCode && item.rack.siteCode.toLowerCase().includes(q)) ||
        (item.rack.roomCode && item.rack.roomCode.toLowerCase().includes(q));

      const nodeMatch = item.nodes.some(
        (node) =>
          node.nodeCode.toLowerCase().includes(q) ||
          (node.displayName && node.displayName.toLowerCase().includes(q)) ||
          (node.managementIp && node.managementIp.toLowerCase().includes(q)),
      );

      return rackMatch || nodeMatch;
    });
  }, [topology, searchQuery]);

  // Tree aggregation: Site -> Room -> Rack (leaf)
  const treeData = useMemo(() => {
    const sites: Record<string, SiteGroup> = {};

    filteredRacks.forEach((item) => {
      const sCode = item.rack.siteCode ? item.rack.siteCode.trim() : "";
      const rCode = item.rack.roomCode ? item.rack.roomCode.trim() : "";

      // Fallbacks
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
      });
    });

    return Object.values(sites);
  }, [filteredRacks]);

  // Expand / Collapse toggles
  const toggleSite = (siteKey: string) => {
    setOpenSites((o) => ({ ...o, [siteKey]: !o[siteKey] }));
  };

  const toggleRoom = (roomKey: string) => {
    setOpenRooms((o) => ({ ...o, [roomKey]: !o[roomKey] }));
  };

  // Selection handlers
  const handleSiteClick = (siteCode: string, siteKey: string) => {
    setSelectedSiteCode(siteCode || "");
    setIsUnmappedDrawerOpen(false);
    if (!openSites[siteKey]) toggleSite(siteKey);
  };

  const handleRoomClick = (
    siteCode: string,
    roomCode: string,
    roomKey: string,
  ) => {
    setSelectedSiteCode(siteCode || "");
    setSelectedRoomCode(roomCode || "");
    setIsUnmappedDrawerOpen(false);
    if (!openRooms[roomKey]) toggleRoom(roomKey);
  };

  const handleRackClick = (
    siteCode: string,
    roomCode: string,
    rackId: string,
  ) => {
    setSelectedSiteCode(siteCode || "");
    setSelectedRoomCode(roomCode || "");
    setSelectedAsset({ id: rackId, assetType: "rack" });
    setIsUnmappedDrawerOpen(false);
    setActivePanelType("rack");
  };

  if (isLoading) {
    return (
      <div className="panel p-4 space-y-4 h-full flex flex-col overflow-hidden animate-pulse">
        <div className="h-9 rounded-md bg-white/5 border border-border/20 shrink-0" />
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 bg-white/5 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasSelection =
    selectedSiteCode !== null ||
    selectedRoomCode !== null ||
    selectedAsset !== null;

  return (
    <div className="panel p-4 space-y-4 h-full flex flex-col overflow-hidden">
      {/* Search Input */}
      <div className="flex items-center gap-2 px-2 h-9 rounded-md bg-surface-1 border border-border shrink-0">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          placeholder="Search by code, IP, name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-xs font-mono placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="label-mono text-[10px] text-muted-foreground">
          Topology Tree
        </div>
        {hasSelection && (
          <button
            onClick={resetFilters}
            className="text-[9px] font-mono text-cyan-ice hover:text-cyan border-b border-cyan/30 hover:border-cyan transition"
          >
            Show All
          </button>
        )}
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 font-mono text-xs pr-1">
        {treeData.length === 0 ? (
          <div className="text-center text-muted-foreground/50 py-8 text-[11px]">
            No assets match filters
          </div>
        ) : (
          treeData.map((site) => {
            const siteKey = site.siteCode || "unassigned-site";
            const siteOpen = searchQuery ? true : !!openSites[siteKey];
            const siteActive =
              selectedSiteCode === (site.siteCode || "") &&
              selectedRoomCode === null &&
              selectedAsset === null;

            return (
              <div key={siteKey} className="w-full">
                {/* Site Node */}
                <div className="flex items-center w-full min-w-0 group/site">
                  <button
                    onClick={() => toggleSite(siteKey)}
                    className="p-1 shrink-0 text-muted-foreground hover:text-cyan-ice"
                  >
                    {siteOpen ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSiteClick(site.siteCode, siteKey)}
                    ref={
                      siteActive && searchQuery
                        ? (el) =>
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            })
                        : undefined
                    }
                    className={`flex-1 text-left px-2 py-1.5 rounded flex items-center gap-2 min-w-0 transition-colors ${
                      siteActive
                        ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold shadow-[0_0_8px_rgba(0,209,255,0.15)]"
                        : "text-foreground hover:bg-white/3 border border-transparent"
                    }`}
                  >
                    <MapPin className="size-3.5 text-purple shrink-0" />
                    <span className="truncate flex-1 font-semibold">
                      {site.displayName}
                    </span>
                  </button>
                </div>

                {/* Rooms List */}
                {siteOpen && (
                  <div className="ml-2 border-l border-border/40 pl-2 space-y-0.5 mt-0.5">
                    {Object.values(site.rooms).map((room) => {
                      const roomKey = `${siteKey}/${room.roomCode || "unknown-room"}`;
                      const roomOpen = searchQuery
                        ? true
                        : !!openRooms[roomKey];
                      const roomActive =
                        selectedSiteCode === (site.siteCode || "") &&
                        selectedRoomCode === (room.roomCode || "") &&
                        selectedAsset === null;

                      return (
                        <div key={roomKey} className="w-full">
                          {/* Room Node */}
                          <div className="flex items-center w-full min-w-0 group/room">
                            <button
                              onClick={() => toggleRoom(roomKey)}
                              className="p-1 shrink-0 text-muted-foreground hover:text-cyan-ice"
                            >
                              {roomOpen ? (
                                <ChevronDown className="size-3" />
                              ) : (
                                <ChevronRight className="size-3" />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleRoomClick(
                                  site.siteCode,
                                  room.roomCode,
                                  roomKey,
                                )
                              }
                              ref={
                                roomActive && searchQuery
                                  ? (el) =>
                                      el?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "nearest",
                                      })
                                  : undefined
                              }
                              className={`flex-1 text-left px-2 py-1 rounded flex items-center gap-2 min-w-0 transition-colors ${
                                roomActive
                                  ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold shadow-[0_0_8px_rgba(0,209,255,0.15)]"
                                  : "text-foreground hover:bg-white/3 border border-transparent"
                              }`}
                            >
                              <Layers className="size-3.5 text-cyan-ice shrink-0" />
                              <span className="truncate flex-1">
                                {room.displayName}
                              </span>
                            </button>
                          </div>

                          {/* Racks List */}
                          {roomOpen && (
                            <div className="ml-8 border-l border-border/40 pl-2 space-y-0.5 mt-0.5">
                              {room.racks.map((rack) => {
                                const rackActive = selectedAsset?.id === rack.id && selectedAsset?.assetType === "rack";

                                return (
                                  <button
                                    key={rack.id}
                                    onClick={() =>
                                      handleRackClick(
                                        site.siteCode,
                                        room.roomCode,
                                        rack.id,
                                      )
                                    }
                                    ref={
                                      rackActive && searchQuery
                                        ? (el) =>
                                            el?.scrollIntoView({
                                              behavior: "smooth",
                                              block: "nearest",
                                            })
                                        : undefined
                                    }
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left min-w-0 transition-colors ${
                                      rackActive
                                        ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold shadow-[0_0_8px_rgba(0,209,255,0.15)]"
                                        : "text-foreground/70 hover:bg-white/3 hover:text-foreground border border-transparent"
                                    }`}
                                  >
                                    <Server className="size-3.5 text-emerald-400 shrink-0" />
                                    <span className="truncate text-[11px] flex-1">
                                      {rack.displayName}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
