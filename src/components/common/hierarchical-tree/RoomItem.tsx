"use client";

import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { RoomGroup } from "./types";
import { RackItem } from "./RackItem";

interface RoomItemProps {
  room: RoomGroup;
  siteCode: string;
  maxLevel: "rack" | "node";
  roomKey: string;
  roomOpen: boolean;
  toggleRoom: (roomKey: string) => void;
  openNodes: Record<string, boolean>;
  toggleRack: (rackKey: string) => void;
}

export function RoomItem({
  room,
  siteCode,
  maxLevel,
  roomKey,
  roomOpen,
  toggleRoom,
  openNodes,
  toggleRack,
}: RoomItemProps) {
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
    selectedRoomCode === room.roomCode &&
    selectedSiteCode === siteCode &&
    !selectedRackId &&
    !selectedNodeCode;

  const handleRoomClick = () => {
    if (isActive) {
      setSelectedRoomCode(null);
      setSelectedRackId(null);
      setSelectedNodeCode(null);
      setActivePanelType(null);
      return;
    }
    setSelectedSiteCode(siteCode || "");
    setSelectedRoomCode(room.roomCode || "");
    setIsUnmappedDrawerOpen(false);
  };

  return (
    <div className="w-full">
      {/* Room Header */}
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
          onClick={() => {
            handleRoomClick();
            if (!openNodes[roomKey]) toggleRoom(roomKey);
          }}
          className={`flex-1 text-left px-2 py-1 rounded flex items-center gap-2 min-w-0 transition-colors ${
            isActive
              ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold light:bg-primary/30 hover:light:bg-primary/40 shadow-[0_0_8px_rgba(0,209,255,0.15)]"
              : "text-foreground hover:bg-white/3 hover:light:bg-primary/15 border border-transparent"
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
        <div
          className={`${
            maxLevel === "rack" ? "ml-8" : "ml-2"
          } border-l border-border/40 pl-2 space-y-0.5 mt-0.5`}
        >
          {room.racks.map((rack) => {
            const rackKey = `${roomKey}/${rack.id}`;
            const rackOpen = !!openNodes[rackKey];

            return (
              <RackItem
                key={rack.id}
                rack={rack}
                siteCode={siteCode}
                roomCode={room.roomCode}
                maxLevel={maxLevel}
                rackKey={rackKey}
                rackOpen={rackOpen}
                toggleRack={toggleRack}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
