"use client";

import { useAssetStore } from "../../hooks/useAssetStore";
import { ArrowRight } from "lucide-react";
import ModalLayout from "@/components/layout/modal-layout";
import {
  useNodeContextQuery,
  useRackTopologyQuery,
} from "@/hooks/asset/use-asset-queries";

export default function ConfirmMoveAsset() {
  const { confirmMoveModalState, setConfirmMoveModalState } = useAssetStore();
  const isOpen = !!confirmMoveModalState;
  const assetType = confirmMoveModalState?.assetType ?? null;
  const assetId = confirmMoveModalState?.assetId ?? null;
  const targetCoords = confirmMoveModalState?.targetCoords ?? null;
  const onConfirm = confirmMoveModalState?.onConfirm ?? (() => {});

  const { data: rackTopology, isLoading: isRackLoading } = useRackTopologyQuery(
    assetId ?? "",
    isOpen && assetType === "rack" && assetId !== null,
  );
  const { data: nodeContext, isLoading: isNodeLoading } = useNodeContextQuery(
    assetId ?? "",
    isOpen && assetType === "node" && assetId !== null,
  );

  // Side-by-side validation coordinate lookup
  const getCoordinates = () => {
    if (assetType === "rack" && rackTopology) {
      console.log("Rack Topology Data:", rackTopology);
      console.log(rackTopology.rack.rowCode);
      return {
        assetName: rackTopology.rack.displayName || rackTopology.rack.rackCode,
        currentCoords: {
          siteCode: rackTopology.rack.siteCode || "UNDEFINED",
          roomCode: rackTopology.rack.roomCode || "UNDEFINED",
          rowCode: rackTopology.rack.rowCode || "UNDEFINED",
          positionCode: rackTopology.rack.positionCode || "UNDEFINED",
        },
      };
    } else {
      // Node
      if (nodeContext) {
        return {
          assetName: nodeContext.node.displayName || nodeContext.node.nodeCode,
          currentCoords: {
            siteCode: nodeContext.rack?.siteCode || "UNDEFINED",
            roomCode: nodeContext.rack?.roomCode || "UNDEFINED",
            rowCode: nodeContext.rack?.rowCode || "UNDEFINED",
            positionCode: nodeContext.node.positionCode || "UNDEFINED",
            rackName:
              nodeContext.rack?.displayName ||
              nodeContext.rack?.rackCode ||
              "UNDEFINED",
          },
        };
      }
    }
    return {
      assetName: "UNASSIGNED",
      currentCoords: {
        siteCode: "UNASSIGNED",
        roomCode: "UNASSIGNED",
        rowCode: "UNASSIGNED",
        positionCode: "UNASSIGNED",
        rackName: "UNASSIGNED",
      },
    };
  };

  const { currentCoords, assetName } = getCoordinates();

  const handleClose = () => {
    setConfirmMoveModalState(null);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!isOpen || !targetCoords) return null;

  return (
    <ModalLayout
      onClose={handleClose}
      isPending={isRackLoading || isNodeLoading}
      eyebrow="RE-LOCATION ASSET // VERIFICATION"
      title={`Confirm Movement for ${assetType === "rack" ? "RACK" : "NODE"} ${assetName}`}
      maxWidth="max-w-xl"
    >
      <div className="p-6">
        {/* Matrix Grid */}
        {isRackLoading || isNodeLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 items-center">
            {/* Current Coordinates */}
            <div className="col-span-3 border border-[#25304A]/50 bg-[#111827] rounded-lg p-4 space-y-3">
              <div className="font-mono text-xs text-muted-foreground light:font-bold border-b border-[#25304A]/50 pb-1">
                CURRENT COORDINATES
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">SITE:</span>
                  <span className="text-foreground font-bold">
                    {currentCoords.siteCode ?? "UNASSIGNED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">ROOM:</span>
                  <span className="text-foreground font-bold truncate max-w-[120px]">
                    {currentCoords.roomCode ?? "UNASSIGNED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">ROW:</span>
                  <span className="text-foreground font-bold">
                    {currentCoords.rowCode ?? "UNASSIGNED"}
                  </span>
                </div>
                {assetType === "node" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/70 light:font-bold">RACK:</span>
                    <span className="text-foreground font-bold truncate max-w-[120px]">
                      {currentCoords.rackName ?? "UNASSIGNED"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">POSITION:</span>
                  <span className="text-foreground font-bold">
                    {currentCoords.positionCode ?? "UNASSIGNED"}
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Separator */}
            <div className="col-span-1 flex justify-center text-cyan">
              <ArrowRight className="size-5" />
            </div>

            {/* Proposed Target Coordinates */}
            <div className="col-span-3 border border-cyan/20 bg-[#111827] shadow-[0_0_15px_rgba(0,209,255,0.05)] rounded-lg p-4 space-y-3">
              <div className="font-mono text-xs text-cyan light:font-bold uppercase border-b border-cyan/20 pb-1">
                PROPOSED TARGET
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">SITE:</span>
                  <span className="text-cyan font-bold">
                    {targetCoords.siteCode ?? "UNASSIGNED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">ROOM:</span>
                  <span className="text-cyan font-bold truncate max-w-[120px]">
                    {targetCoords.roomCode ?? "UNASSIGNED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">ROW:</span>
                  <span className="text-cyan font-bold">
                    {targetCoords.rowCode ?? "UNASSIGNED"}
                  </span>
                </div>
                {assetType === "node" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/70 light:font-bold">RACK:</span>
                    <span className="text-cyan font-bold truncate max-w-[120px]">
                      {targetCoords.rackName ??
                        targetCoords.rackId ??
                        "UNASSIGNED"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground/70 light:font-bold">POSITION:</span>
                  <span className="text-cyan font-bold">
                    {targetCoords.positionCode ?? "UNASSIGNED"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#25304A] pt-4 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-mono rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={isRackLoading || isNodeLoading}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-mono rounded-lg bg-cyan text-primary-foreground font-semibold hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition"
          >
            CONFIRM MOVEMENT
          </button>
        </div>
      </div>
    </ModalLayout>
  );
}
