"use client";

import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { useRackTopologyQuery } from "@/hooks/asset/use-asset-queries";
import { ChevronDown, ChevronRight, Server, Loader2 } from "lucide-react";
import { RackGroup } from "./types";
import { NodeItem } from "./NodeItem";
import { useRouter, usePathname } from "next/navigation";

interface RackItemProps {
  rack: RackGroup;
  siteCode: string;
  roomCode: string;
  maxLevel: "rack" | "node";
  rackKey: string;
  rackOpen: boolean;
  toggleRack: (rackKey: string) => void;
}

export function RackItem({
  rack,
  siteCode,
  roomCode,
  maxLevel,
  rackKey,
  rackOpen,
  toggleRack,
}: RackItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const selectedRackId = useAssetStore((s) => s.selectedRackId);
  const selectedNodeCode = useAssetStore((s) => s.selectedNodeCode);

  const setSelectedSiteCode = useAssetStore((s) => s.setSelectedSiteCode);
  const setSelectedRoomCode = useAssetStore((s) => s.setSelectedRoomCode);
  const setSelectedRackId = useAssetStore((s) => s.setSelectedRackId);
  const setSelectedNodeCode = useAssetStore((s) => s.setSelectedNodeCode);
  const setIsUnmappedDrawerOpen = useAssetStore(
    (s) => s.setIsUnmappedDrawerOpen,
  );
  const setActivePanelType = useAssetStore((s) => s.setActivePanelType);

  const isActive = selectedRackId === rack.id && !selectedNodeCode;

  const { isLoading: isRackLoading } = useRackTopologyQuery(
    rack.id,
    isActive && selectedNodeCode === null,
    {
      select: (data) => data?.rack ?? null,
    },
  );

  const handleRackClick = () => {
    if (isActive) {
      setSelectedRackId(null);
      setSelectedNodeCode(null);
      setActivePanelType(null);
      if (pathname.startsWith("/monitoring")) {
        router.push(`/monitoring`);
      }
      return;
    }
    setSelectedSiteCode(siteCode || "");
    setSelectedRoomCode(roomCode || "");
    setSelectedRackId(rack.id);
    if (pathname.startsWith("/assets")) {
      setIsUnmappedDrawerOpen(false);
      setActivePanelType("rack");
    } else if (pathname.startsWith("/monitoring")) {
      setSelectedNodeCode(null);
      router.push(`/monitoring/${rack.id}`);
    }
  };

  if (maxLevel === "rack") {
    // Leaf Node style (Asset Management)
    return (
      <button
        onClick={handleRackClick}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left min-w-0 transition-colors ${
          isActive
            ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold light:bg-primary/30 hover:light:bg-primary/40 shadow-[0_0_8px_rgba(0,209,255,0.15)]"
            : "text-foreground/70 hover:bg-white/3 hover:light:bg-primary/15 hover:text-foreground border border-transparent"
        }`}
      >
        {isActive && isRackLoading ? (
          <Loader2 className="size-3.5 text-cyan animate-spin shrink-0" />
        ) : (
          <Server className="size-3.5 text-emerald-400 shrink-0" />
        )}
        <span className="truncate text-[11px] flex-1">{rack.displayName}</span>
      </button>
    );
  }

  // Expandable parent folder (Monitoring)
  return (
    <div className="w-full">
      <div className="flex items-center w-full min-w-0 group/rack">
        <button
          onClick={() => toggleRack(rackKey)}
          className="p-1 text-muted-foreground hover:text-cyan-ice shrink-0"
        >
          {rackOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>

        <button
          onClick={handleRackClick}
          className={`flex-1 text-left px-2 py-1 flex items-center gap-1.5 min-w-0 rounded transition-colors ${
            isActive
              ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold light:bg-primary/30 hover:light:bg-primary/40 shadow-[0_0_8px_rgba(0,209,255,0.15)]"
              : "text-slate-400 hover:bg-white/3 hover:light:bg-primary/15 hover:text-foreground border border-transparent"
          }`}
        >
          {isActive && isRackLoading ? (
            <Loader2 className="size-3.5 text-cyan animate-spin shrink-0" />
          ) : (
            <Server className="size-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="truncate text-[11px] flex-1">
            {rack.displayName}
          </span>
        </button>
      </div>

      {rackOpen && (
        <div className="ml-4 border-l border-border/40 pl-2 space-y-0.5 mt-0.5">
          {rack.nodes.map((node) => (
            <NodeItem
              key={node.id}
              node={node}
              siteCode={siteCode}
              roomCode={roomCode}
              rackId={rack.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
