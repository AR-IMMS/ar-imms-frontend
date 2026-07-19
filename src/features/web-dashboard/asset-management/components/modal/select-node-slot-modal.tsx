"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAssetStore } from "../../hooks/useAssetStore";
import { useRackTopologyQuery } from "@/hooks/asset/use-asset-queries";
import { useAssignNodeMutation } from "@/hooks/asset/use-asset-mutations";
import ModalLayout from "@/components/layout/modal-layout";

export default function AssignUnmapNodeModal() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const assignNodeMutation = useAssignNodeMutation();
  const {
    assignNodeModalState,
    setAssignNodeModalState,
    setConfirmMoveModalState,
  } = useAssetStore();

  const isOpen = !!assignNodeModalState;
  const nodeId = assignNodeModalState?.nodeId ?? "";
  const rackId = assignNodeModalState?.rackId ?? "";

  // Fetch target rack data
  const { data: rackTopology, isLoading } = useRackTopologyQuery(
    rackId,
    isOpen,
  );

  const capacity = rackTopology?.rack?.capacityLimit ?? 42;
  const rackName =
    rackTopology?.rack?.displayName || rackTopology?.rack?.rackCode || rackId;
  const occupiedSlots = useMemo(() => {
    if (!rackTopology?.nodes) return new Set<string>();
    return new Set(
      rackTopology.nodes
        .map((n) => n.positionCode?.trim())
        .filter(Boolean) as string[],
    );
  }, [rackTopology]);

  // #region - handle actions and state

  const handleClose = () => {
    setSelectedSlot(null);
    setAssignNodeModalState(null);
  };

  const handleNext = () => {
    if (!selectedSlot) {
      toast.error("Please select a target U-position slot");
      return;
    }

    const targetCoords = {
      siteCode: rackTopology?.rack?.siteCode ?? "N/A",
      roomCode: rackTopology?.rack?.roomCode ?? "N/A",
      rowCode: rackTopology?.rack?.rowCode ?? "N/A",
      positionCode: selectedSlot,
      rackId,
      rackName,
    };

    // Close ourselves and trigger confirm-move-asset modal
    handleClose();
    setConfirmMoveModalState({
      assetType: "node",
      assetId: null,
      targetCoords,
      onConfirm: () => {
        const payload = {
          rackId,
          positionCode: selectedSlot,
        };

        const successCallback = () => {
          toast.success(
            `Node assigned to ${rackName} with position ${selectedSlot} successfully`,
          );
        };
        const errorCallback = (err: Error) => {
          toast.error(err.message || `Failed to assign node to ${rackName}`);
        };

        assignNodeMutation.mutate(
          { nodeId, payload },
          { onSuccess: successCallback, onError: errorCallback },
        );
      },
    });
  };

  // #endregion - handle actions and state

  // #region - render section

  if (!isOpen) return null;

  return (
    <ModalLayout
      onClose={handleClose}
      eyebrow="NODE ASSIGNMENT // SELECT TARGET SLOT"
      title={`Node: ${nodeId}`}
      isPending={isLoading}
      maxWidth="max-w-2xl"
    >
      <div className="p-6 flex flex-col h-125 justify-between">
        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="flex justify-between items-center text-xs font-mono text-muted-foreground light:font-bold border-b border-[#25304A]/60 pb-2">
            <span>TARGET RACK:</span>
            <span className="text-cyan-ice font-bold uppercase">
              {rackName || rackId || "Undefined"}
            </span>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2 animate-pulse">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-white/5 rounded border border-[#25304A]/30"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: capacity }).map((_, i) => {
                  const slotNum = i + 1; // typically 1 up to 42
                  const slotStr = `${slotNum}U`;
                  const isOccupied =
                    occupiedSlots.has(slotStr) ||
                    occupiedSlots.has(String(slotNum));

                  return (
                    <button
                      key={slotNum}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setSelectedSlot(slotStr)}
                      className={`h-10 border font-mono text-[10px] rounded flex flex-col items-center justify-center transition ${
                        isOccupied
                          ? "bg-red-500/10 border-red-500/25 text-red-500/70 cursor-not-allowed"
                          : selectedSlot === slotStr
                            ? "bg-cyan/15 border-cyan text-cyan shadow-[0_0_10px_rgba(0,209,255,0.2)]"
                            : "bg-background border-[#25304A] text-foreground hover:border-cyan/50 hover:bg-cyan/10"
                      }`}
                    >
                      <span className="font-bold">{slotStr}</span>
                      {isOccupied && (
                        <span className="text-[10px] text-red-500 font-bold scale-90">
                          OCCUPIED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#25304A] pt-4 mt-6 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-mono rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={!selectedSlot || isLoading}
            onClick={handleNext}
            className="px-4 py-2 text-xs font-mono rounded-lg bg-cyan text-primary-foreground font-semibold hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition disabled:opacity-30 disabled:hover:shadow-none"
          >
            REVIEW MOVEMENT
          </button>
        </div>
      </div>
    </ModalLayout>
  );

  // #endregion - render section
}
