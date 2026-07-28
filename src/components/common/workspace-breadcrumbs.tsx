"use client";

import { useMemo } from "react";
import { useUiConfigStore } from "@/stores/ui-config-store";
import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import {
  useNodeContextQuery,
  useRackTopologyQuery,
} from "@/hooks/asset/use-asset-queries";
import {
  ChevronRight,
  Database,
  MapPin,
  Layers,
  Server,
  Cpu,
  Loader2,
} from "lucide-react";
import { RackEntity, RackTopologyResult } from "@/types/assets";

export interface WorkspaceBreadcrumbsProps {
  className?: string;
}

export function WorkspaceBreadcrumbs({ className = "" }: WorkspaceBreadcrumbsProps) {
  const isTopologyTreeCollapsed = useUiConfigStore((s) => s.isTopologyTreeCollapsed);
  
  const selectedSiteCode = useAssetStore((s) => s.selectedSiteCode);
  const selectedRoomCode = useAssetStore((s) => s.selectedRoomCode);
  const selectedRackId = useAssetStore((s) => s.selectedRackId);
  const selectedNodeCode = useAssetStore((s) => s.selectedNodeCode);

  const setSelectedSiteCode = useAssetStore((s) => s.setSelectedSiteCode);
  const setSelectedRoomCode = useAssetStore((s) => s.setSelectedRoomCode);
  const setSelectedNodeCode = useAssetStore((s) => s.setSelectedNodeCode);
  const setSelectedRackId = useAssetStore((s) => s.setSelectedRackId);
  const setActivePanelType = useAssetStore((s) => s.setActivePanelType);
  const resetFilters = useAssetStore((s) => s.resetFilters);

  // execute only when corresponding ID is present in the store
  const { data: rawRackItem, isLoading: isRackLoading } = useRackTopologyQuery(
    selectedRackId ?? "",
    !!selectedRackId,
    {
      select: (data: RackTopologyResult) => data?.rack ?? null,
    },
  );
  const rackItem = rawRackItem as RackEntity | null;

  const { data: nodeContext, isLoading: isNodeLoading } = useNodeContextQuery(
    selectedNodeCode ?? "",
    !!selectedNodeCode,
  );

  // Dynamically compute breadcrumb items from Zustand store selected state
  const breadcrumbs = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      type: "site" | "room" | "rack" | "node";
      isLoading?: boolean;
    }> = [];

    if (selectedSiteCode) {
      list.push({
        id: selectedSiteCode,
        name: selectedSiteCode,
        type: "site",
      });
    }

    if (selectedRoomCode) {
      list.push({
        id: selectedRoomCode,
        name: selectedRoomCode,
        type: "room",
      });
    }

    if (selectedRackId) {
      const name = isRackLoading
        ? "Cabinet Loading..."
        : (rackItem?.displayName || rackItem?.rackCode || selectedRackId);
      list.push({
        id: selectedRackId,
        name,
        type: "rack",
        isLoading: isRackLoading,
      });
    }

    if (selectedNodeCode && selectedRackId) {
      const name = isNodeLoading
        ? "Node Loading..."
        : (nodeContext?.node?.displayName || nodeContext?.node?.nodeCode || selectedNodeCode);
      list.push({
        id: selectedNodeCode,
        name,
        type: "node",
        isLoading: isNodeLoading,
      });
    }

    return list;
  }, [
    selectedSiteCode,
    selectedRoomCode,
    selectedRackId,
    selectedNodeCode,
    rackItem,
    nodeContext,
    isRackLoading,
    isNodeLoading,
  ]);

  const handleSegmentClick = (index: number) => {
    if (index === -1) {
      resetFilters();
      return;
    }

    const clickedItem = breadcrumbs[index];

    if (clickedItem.type === "site") {
      setSelectedSiteCode(clickedItem.id);
      setSelectedRoomCode(null);
      setSelectedNodeCode(null);
      setSelectedRackId(null);
      setActivePanelType("site");
    } else if (clickedItem.type === "room") {
      setSelectedSiteCode(selectedSiteCode);
      setSelectedRoomCode(clickedItem.id);
      setSelectedNodeCode(null);
      setSelectedRackId(null);
      setActivePanelType(null);
    } else if (clickedItem.type === "rack") {
      setSelectedSiteCode(selectedSiteCode);
      setSelectedRoomCode(selectedRoomCode);
      setSelectedNodeCode(null);
      setSelectedRackId(clickedItem.id);
      setActivePanelType("rack");
    } else if (clickedItem.type === "node") {
      setSelectedSiteCode(selectedSiteCode);
      setSelectedRoomCode(selectedRoomCode);
      setSelectedRackId(selectedRackId);
      setSelectedNodeCode(clickedItem.id);
      setActivePanelType("node");
    }
  };

  const getIcon = (type: string, isActive: boolean, isLoading?: boolean) => {
    const sizeClass = "size-3.5 shrink-0";
    
    if (isLoading) {
      return <Loader2 className={`${sizeClass} text-cyan animate-spin`} />;
    }

    switch (type) {
      case "site":
        return (
          <MapPin
            className={`${sizeClass} ${
              isActive
                ? "text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]"
                : "text-purple-400/70"
            }`}
          />
        );
      case "room":
        return (
          <Layers
            className={`${sizeClass} ${
              isActive
                ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                : "text-cyan-400/70"
            }`}
          />
        );
      case "rack":
        return (
          <Server
            className={`${sizeClass} ${
              isActive
                ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                : "text-emerald-400/70"
            }`}
          />
        );
      case "node":
        return (
          <Cpu
            className={`${sizeClass} ${
              isActive
                ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                : "text-slate-400"
            }`}
          />
        );
      default:
        return (
          <Database
            className={`${sizeClass} ${
              isActive
                ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                : "text-slate-400"
            }`}
          />
        );
    }
  };

  const isRootActive = breadcrumbs.length === 0;

  return (
    <div
      className={`h-9 px-4 flex items-center gap-2 border border-border bg-accent/50 backdrop-blur-md rounded-lg shrink-0 font-mono text-xs select-none z-10 transition-all ${className}`}
    >
      {/* Root Breadcrumb Item */}
      <button
        onClick={() => handleSegmentClick(-1)}
        className={`flex items-center gap-1.5 transition duration-150 ${
          isRootActive
            ? "text-cyan-ice font-bold drop-shadow-[0_0_8px_rgba(0,209,255,0.45)] cursor-default"
            : "text-slate-500 hover:text-cyan-ice cursor-pointer"
        }`}
        disabled={isRootActive}
      >
        {getIcon("root", isRootActive)}
        <span>Workspace</span>
      </button>

      {/* Path Breadcrumb Items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-center gap-2"
          >
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            <button
              onClick={() => handleSegmentClick(index)}
              disabled={isLast || item.isLoading}
              className={`flex items-center gap-1.5 transition duration-150 ${
                isLast
                  ? "text-cyan-ice font-bold drop-shadow-[0_0_8px_rgba(0,209,255,0.45)] cursor-default"
                  : "text-slate-500 hover:text-cyan-ice cursor-pointer"
              } ${item.isLoading ? "animate-pulse opacity-75 cursor-wait" : ""}`}
            >
              {getIcon(item.type, isLast, item.isLoading)}
              <span>{item.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
