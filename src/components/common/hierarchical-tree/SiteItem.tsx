"use client";

import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { SiteGroup } from "./types";
import { RoomItem } from "./RoomItem";

interface SiteItemProps {
  site: SiteGroup;
  maxLevel: "rack" | "node";
  siteKey: string;
  siteOpen: boolean;
  toggleSite: (siteKey: string) => void;
  openNodes: Record<string, boolean>;
  toggleRoom: (roomKey: string) => void;
  toggleRack: (rackKey: string) => void;
}

export function SiteItem({
  site,
  maxLevel,
  siteKey,
  siteOpen,
  toggleSite,
  openNodes,
  toggleRoom,
  toggleRack,
}: SiteItemProps) {
  const selectedSiteCode = useAssetStore((s) => s.selectedSiteCode);
  const selectedRoomCode = useAssetStore((s) => s.selectedRoomCode);
  const selectedRackId = useAssetStore((s) => s.selectedRackId);
  const selectedNodeCode = useAssetStore((s) => s.selectedNodeCode);
  
  const setSelectedSiteCode = useAssetStore((s) => s.setSelectedSiteCode);
  const setSelectedRoomCode = useAssetStore((s) => s.setSelectedRoomCode);
  const setSelectedRackId = useAssetStore((s) => s.setSelectedRackId);
  const setSelectedNodeCode = useAssetStore((s) => s.setSelectedNodeCode);
  const setIsUnmappedDrawerOpen = useAssetStore((s) => s.setIsUnmappedDrawerOpen);
  const setActivePanelType = useAssetStore((s) => s.setActivePanelType);

  const isActive =
    selectedSiteCode === site.siteCode &&
    !selectedRoomCode &&
    !selectedRackId &&
    !selectedNodeCode;

  const handleSiteClick = () => {
    if (isActive) {
      setSelectedSiteCode(null);
      setSelectedRoomCode(null);
      setSelectedRackId(null);
      setSelectedNodeCode(null);
      setActivePanelType(null);
      return;
    }
    setSelectedSiteCode(site.siteCode || "");
    setIsUnmappedDrawerOpen(false);
  };

  return (
    <div className="w-full">
      {/* Site Header */}
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
          onClick={() => {
            handleSiteClick();
            if (!openNodes[siteKey]) toggleSite(siteKey);
          }}
          className={`flex-1 text-left px-2 py-1.5 rounded flex items-center gap-2 min-w-0 transition-colors ${
            isActive
              ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold light:bg-primary/30 hover:light:bg-primary/40 shadow-[0_0_8px_rgba(0,209,255,0.15)]"
              : "text-foreground hover:bg-white/3 hover:light:bg-primary/15 border border-transparent"
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
            const roomOpen = !!openNodes[roomKey];

            return (
              <RoomItem
                key={room.roomCode}
                room={room}
                siteCode={site.siteCode}
                maxLevel={maxLevel}
                roomKey={roomKey}
                roomOpen={roomOpen}
                toggleRoom={toggleRoom}
                openNodes={openNodes}
                toggleRack={toggleRack}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
