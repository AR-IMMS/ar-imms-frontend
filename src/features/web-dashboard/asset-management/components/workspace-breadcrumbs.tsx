"use client";

import { useUiConfigStore } from "@/stores/ui-config-store";
import { useAssetStore } from "../hooks/useAssetStore";
import { ChevronRight, Database, MapPin, Layers, Server } from "lucide-react";

export function WorkspaceBreadcrumbs() {
  const { activeNavigationPath, isTopologyTreeCollapsed } = useUiConfigStore();
  const {
    setSelectedSiteCode,
    setSelectedRoomCode,
    setSelectedAsset,
    setActivePanelType,
    resetFilters,
  } = useAssetStore();

  const handleSegmentClick = (index: number) => {
    if (index === -1) {
      // Clicked root "Workspace"
      resetFilters();
      return;
    }

    const clickedItem = activeNavigationPath[index];

    if (clickedItem.type === "site") {
      setSelectedSiteCode(clickedItem.id);
      setSelectedRoomCode(null);
      setSelectedAsset(null);
      setActivePanelType("site");
    } else if (clickedItem.type === "room") {
      const siteItem = activeNavigationPath.find(
        (item) => item.type === "site",
      );
      setSelectedSiteCode(siteItem ? siteItem.id : "");
      setSelectedRoomCode(clickedItem.id);
      setSelectedAsset(null);
      setActivePanelType(null);
    } else if (clickedItem.type === "rack") {
      const siteItem = activeNavigationPath.find(
        (item) => item.type === "site",
      );
      const roomItem = activeNavigationPath.find(
        (item) => item.type === "room",
      );
      setSelectedSiteCode(siteItem ? siteItem.id : "");
      setSelectedRoomCode(roomItem ? roomItem.id : "");
      setSelectedAsset({ id: clickedItem.id, assetType: "rack" });
      setActivePanelType("rack");
    }
  };

  const getIcon = (type: string, isActive: boolean) => {
    const sizeClass = "size-3.5 shrink-0";
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

  const isRootActive = activeNavigationPath.length === 0;

  return (
    <div
      className={`absolute top-0 h-9 px-4 flex items-center gap-2 border border-border bg-accent/50 backdrop-blur-md rounded-lg shrink-0 font-mono text-xs select-none z-20 ${
        isTopologyTreeCollapsed ? "left-0" : "left-4"
      }`}
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
      {activeNavigationPath.map((item, index) => {
        const isLast = index === activeNavigationPath.length - 1;
        return (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-center gap-2"
          >
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            <button
              onClick={() => handleSegmentClick(index)}
              disabled={isLast}
              className={`flex items-center gap-1.5 transition duration-150 ${
                isLast
                  ? "text-cyan-ice font-bold drop-shadow-[0_0_8px_rgba(0,209,255,0.45)] cursor-default"
                  : "text-slate-500 hover:text-cyan-ice cursor-pointer"
              }`}
            >
              {getIcon(item.type, isLast)}
              <span>{item.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
