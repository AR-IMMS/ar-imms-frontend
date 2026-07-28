"use client";

import { useAssetStore } from "@/features/web-dashboard/asset-management/hooks/useAssetStore";
import { useNodeContextQuery } from "@/hooks/asset/use-asset-queries";
import { Cpu, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { NodeLeaf } from "./types";

interface NodeItemProps {
  node: NodeLeaf;
  siteCode: string;
  roomCode: string;
  rackId: string;
}

export function NodeItem({ node, siteCode, roomCode, rackId }: NodeItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const selectedNodeCode = useAssetStore((s) => s.selectedNodeCode);
  const setSelectedSiteCode = useAssetStore((s) => s.setSelectedSiteCode);
  const setSelectedRoomCode = useAssetStore((s) => s.setSelectedRoomCode);
  const setSelectedRackId = useAssetStore((s) => s.setSelectedRackId);
  const setSelectedNodeCode = useAssetStore((s) => s.setSelectedNodeCode);

  const isActive = selectedNodeCode === node.id;

  const { isLoading: isNodeLoading } = useNodeContextQuery(node.id, isActive);

  const handleNodeClick = () => {
    if (isActive) {
      setSelectedNodeCode(null);
      if (pathname.startsWith("/monitoring")) {
        router.push(`/monitoring/${rackId}`);
      }
      return;
    }
    setSelectedSiteCode(siteCode || "");
    setSelectedRoomCode(roomCode || "");
    setSelectedRackId(rackId || "");
    if (pathname.startsWith("/monitoring")) {
      setSelectedNodeCode(node.id || "");
      router.push(`/monitoring/${rackId}/${node.id}`);
    }
  };

  return (
    <button
      onClick={handleNodeClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left min-w-0 transition-all ${
        isActive
          ? "bg-cyan/10 text-cyan border border-cyan/30 font-semibold shadow-[0_0_8px_rgba(0,209,255,0.15)]"
          : "text-foreground/60 hover:bg-white/3 hover:text-foreground border border-transparent"
      }`}
    >
      {isActive && isNodeLoading ? (
        <Loader2 className="size-3.5 text-cyan animate-spin shrink-0" />
      ) : (
        <Cpu className="size-3.5 text-cyan-ice shrink-0" />
      )}
      <span className="truncate text-[11px] flex-1">{node.displayName}</span>
    </button>
  );
}
