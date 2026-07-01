"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Layers, Cpu } from "lucide-react";
import {
  useDiscoveredNodesQuery,
  useTopologyTreeQuery,
  useUnassignedNodesQuery,
} from "@/hooks/asset/use-asset-queries";
import { useAssetStore } from "../hooks/useAssetStore";
import { parseCoordinate } from "../lib/utils/parse-coordinate";

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

export function UnmappedAssetsDrawer() {
  const { data: topology = [] } = useTopologyTreeQuery();
  const { data: discoveredNodes = [] } = useDiscoveredNodesQuery();
  const { data: unassignedNodes = [] } = useUnassignedNodesQuery();

  const {
    selectedRackId,
    selectedNodeId,
    setSelectedRackId,
    setSelectedNodeId,
    isUnmappedDrawerOpen,
    setIsUnmappedDrawerOpen,
    setActivePanelType,
  } = useAssetStore();

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

  const unmappedDiscoveredNodes = useMemo(() => {
    return discoveredNodes.filter(
      (node) => node.assignmentState === "UNASSIGNED",
    );
  }, [discoveredNodes]);

  const unifiedItems = useMemo(() => {
    const racksList = unmappedRacks.map((r) => ({
      type: "rack" as const,
      id: r.rack.id,
      code: r.rack.rackCode,
      name: r.rack.displayName || r.rack.rackCode,
      siteCode: r.rack.siteCode || null,
      roomCode: r.rack.roomCode || null,
      rowCode: r.rack.rowCode || null,
      positionCode: r.rack.positionCode || null,
      vendor: r.rack.vendor || "GENERIC",
      notes: r.rack.notes || "",
      capacityState: r.rack.capacityState || "AVAILABLE",
      capacityLimit: r.rack.capacityLimit || 42,
    }));

    const discoveredList = unmappedDiscoveredNodes.map((n) => ({
      type: "discovered-node" as const,
      id: n.agentId,
      code: n.hostname,
      name: n.hostname,
      vendor: n.hardware?.vendor || "GENERIC",
      model: n.hardware?.model || "GENERIC",
      macAddress: n.hardware?.macAddress || "N/A",
      os: n.hardware?.osProduct || "N/A",
      deviceType: n.deviceType || "Server",
      ip: n.hardware?.primaryIpv4 || "N/A",
    }));

    const entitiesList = unassignedNodes.map((n) => {
      const meta = n.metadata as unknown as DiscoveredNodeMetadata;
      const metaDisc = meta?.discoveredNode;
      const ipAddr = n.managementIp || metaDisc?.hardware?.primaryIpv4 || "N/A";
      const osProd = metaDisc?.hardware?.osProduct || "N/A";
      const vendorName = metaDisc?.hardware?.vendor || "GENERIC";
      const modelName = metaDisc?.hardware?.model || "GENERIC";
      const mac = metaDisc?.hardware?.macAddress || "N/A";

      return {
        type: "node-entity" as const,
        id: n.id,
        code: n.nodeCode,
        name: n.displayName || n.hostname || n.nodeCode,
        vendor: vendorName,
        model: modelName,
        macAddress: mac,
        os: osProd,
        deviceType: n.nodeType || "Server",
        ip: ipAddr,
      };
    });

    return [...racksList, ...discoveredList, ...entitiesList];
  }, [unmappedRacks, unmappedDiscoveredNodes, unassignedNodes]);

  if (unifiedItems.length === 0) return null;

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 bg-[#090f1d]/95 border-t border-cyan/20 backdrop-blur-xl transition-all duration-300 ${
        isUnmappedDrawerOpen ? "h-64" : "h-12"
      }`}
    >
      {/* Drawer Header */}
      <button
        onClick={() => {
          const nextOpen = !isUnmappedDrawerOpen;
          setIsUnmappedDrawerOpen(nextOpen);
          if (nextOpen) {
            setSelectedRackId(null);
            setSelectedNodeId(null);
            setActivePanelType(null);
          }
        }}
        className="w-full flex items-center justify-between px-6 h-11 border-b border-border/30 font-mono text-[13px] text-foreground hover:bg-white/[0.02] cursor-pointer"
      >
        <div className="flex items-center gap-2 font-semibold">
          <span>UNMAPPED ASSETS</span>
          <span className="bg-cyan/10 border border-cyan/30 text-cyan rounded-full px-2 py-0.5 text-xs">
            {unifiedItems.length}
          </span>
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
        <div className="h-[213px] overflow-x-auto overflow-y-hidden flex items-center gap-5 p-5 custom-scrollbar-h bg-background/50 animate-fade-in">
          {unifiedItems.map((item) => {
            if (item.type === "rack") {
              const isSelected = selectedRackId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedRackId(null);
                    } else {
                      setSelectedRackId(item.id);
                      setSelectedNodeId(null);
                    }
                    setActivePanelType(null);
                  }}
                  className={`w-72 shrink-0 min-h-40 max-h-43 overflow-y-auto pr-1 custom-scrollbar rounded-xl border bg-[#0d152a]/90 p-4 flex flex-col justify-between transition-all cursor-pointer hover:border-cyan hover:shadow-[0_0_15px_rgba(0,209,255,0.15)] ${
                    isSelected
                      ? "border-cyan bg-cyan/5 shadow-[0_0_20px_rgba(0,209,255,0.2)] font-semibold"
                      : "border-border/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 border-b border-border/20 pb-2 mb-2 sticky top-0 z-10">
                      <Layers className="size-4 text-cyan" />
                      <span className="font-mono text-xs font-bold text-foreground truncate flex-1">
                        {item.name}
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                      <div>
                        Code:{" "}
                        <span className="text-foreground font-semibold">
                          {item.code}
                        </span>
                      </div>
                      <div>
                        Vendor:{" "}
                        <span className="text-foreground">{item.vendor}</span>
                      </div>
                      <div>
                        Capacity:{" "}
                        <span className="text-foreground">
                          {item.capacityState} ({item.capacityLimit}U)
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
              const isSelected = selectedNodeId === item.id;
              const isDiscovered = item.type === "discovered-node";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedNodeId(null);
                    } else {
                      setSelectedRackId(null);
                      setSelectedNodeId(item.id);
                    }
                    setActivePanelType(null);
                  }}
                  className={`w-72 shrink-0 min-h-40 max-h-43 overflow-y-auto pr-1 custom-scrollbar rounded-xl border bg-[#0d152a]/90 p-4 flex flex-col justify-between transition-all cursor-pointer hover:border-cyan hover:shadow-[0_0_15px_rgba(0,209,255,0.15)] ${
                    isSelected
                      ? "border-cyan bg-cyan/5 shadow-[0_0_20px_rgba(0,209,255,0.2)] font-semibold"
                      : "border-border/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 border-b border-border/20 pb-2 mb-2 sticky top-0 z-10 bg-[#0d152a]">
                      <Cpu
                        className={`size-4 ${isDiscovered ? "text-purple-400" : "text-emerald-400"}`}
                      />
                      <span className="font-mono text-xs font-bold text-foreground truncate flex-1">
                        {item.name}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          isDiscovered
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {isDiscovered ? "Discovered" : "Saved"}
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                      <div className="truncate">
                        Node type:{" "}
                        <span className="text-foreground/80 uppercase truncate font-mono font-semibold">
                          {item.deviceType}
                        </span>
                      </div>
                      <div className="truncate">
                        Code:{" "}
                        <span className="text-foreground truncate font-mono font-semibold text-[9.5px]">
                          {item.code}
                        </span>
                      </div>
                      <div>
                        IP Address:{" "}
                        <span className="text-foreground font-mono">
                          {item.ip}
                        </span>
                      </div>
                      <div>
                        macAddress:{" "}
                        <span className="text-foreground font-mono">
                          {item.macAddress}
                        </span>
                      </div>
                      <div className="truncate">
                        OS Product:{" "}
                        <span className="text-foreground">{item.os}</span>
                      </div>
                      <div className="truncate">
                        Hardware:{" "}
                        <span className="text-foreground">
                          {item.vendor} {item.model}
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
}
