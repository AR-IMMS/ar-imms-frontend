"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAssetStore } from "../../hooks/useAssetStore";
import { useRackTopologyQuery } from "@/hooks/asset/use-asset-queries";
import {
  useCreateRackMutation,
  useUpdateRackMutation,
} from "@/hooks/asset/use-asset-mutations";
import ModalLayout from "@/components/layout/modal-layout";

export default function CreateEditRackModal() {
  const { createEditRackModal, setCreateEditRackModal, topologyData } =
    useAssetStore();
  const isOpen = !!createEditRackModal?.isOpen;
  const rackId = createEditRackModal?.rackId ?? null;

  // Fallback query if not found in cache
  const { data: fetchedTopology } = useRackTopologyQuery(
    rackId ?? "",
    !!rackId,
  );

  const existingRack = useMemo(() => {
    if (!rackId) return null;
    const cached = topologyData.find((t) => t.rack.id === rackId);
    if (cached) return cached.rack;
    return fetchedTopology?.rack ?? null;
  }, [rackId, topologyData, fetchedTopology]);

  // Form states initialized directly from existingRack
  const [displayName, setDisplayName] = useState(
    () => existingRack?.displayName ?? "",
  );
  const [vendor, setVendor] = useState(() => existingRack?.vendor ?? "");
  const [capacityLimit, setCapacityLimit] = useState(
    () => existingRack?.capacityLimit ?? 42,
  );
  const [siteCode, setSiteCode] = useState(() => existingRack?.siteCode ?? "");
  const [roomCode, setRoomCode] = useState(() => existingRack?.roomCode ?? "");
  const [rowCode, setRowCode] = useState(() => existingRack?.rowCode ?? "");
  const [positionCode, setPositionCode] = useState(
    () => existingRack?.positionCode ?? "",
  );
  const [notes, setNotes] = useState(() => existingRack?.notes ?? "");

  const createMutation = useCreateRackMutation();
  const updateMutation = useUpdateRackMutation();

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  const handleClose = () => {
    if (isPending) return;
    setCreateEditRackModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display Name is required.");
      return;
    }

    const payload = {
      rackCode: `rack-${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      displayName,
      vendor: vendor || undefined,
      capacityLimit: Number(capacityLimit) || 42,
      siteCode: siteCode || undefined,
      roomCode: roomCode || undefined,
      rowCode: rowCode || undefined,
      positionCode: positionCode || undefined,
      notes: notes || undefined,
    };

    if (rackId) {
      updateMutation.mutate(
        { rackId, payload },
        {
          onSuccess: () => {
            toast.success("Rack updated successfully.");
            handleClose();
          },
          onError: (err: Error) => {
            toast.error(err.message || "Failed to update rack.");
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Rack registered successfully.");
          handleClose();
        },
        onError: (err: Error) => {
          toast.error(err.message || "Failed to register rack.");
        },
      });
    }
  };

  return (
    <ModalLayout
      onClose={handleClose}
      eyebrow={rackId ? "ADMIN // UPDATE RACK" : "ADMIN // REGISTER RACK"}
      title={
        rackId
          ? `Edit Rack Properties (ID: ${rackId})`
          : "Configure New Infrastructure"
      }
      isPending={isPending}
      maxWidth="max-w-xl"
    >
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80 uppercase">
              DISPLAY NAME
            </label>
            <input
              type="text"
              disabled={isPending}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80">
              RACK CODE (auto-generated)
            </label>
            <input
              type="text"
              disabled={true}
              value={`rack-${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              className="w-full bg-background border border-[#25304A] text-muted-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80 uppercase">
              CAPACITY (U)
            </label>
            <input
              type="number"
              disabled={isPending}
              value={capacityLimit}
              onChange={(e) => setCapacityLimit(Number(e.target.value))}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
              min={12}
              max={58}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80">
              VENDOR (optional)
            </label>
            <input
              type="text"
              disabled={isPending}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-2 space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80 uppercase">
              SITE CODE
            </label>
            <input
              type="text"
              disabled={isPending}
              value={siteCode}
              onChange={(e) => setSiteCode(e.target.value)}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
              placeholder="e.g. HN"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80 uppercase">
              ROOM CODE
            </label>
            <input
              type="text"
              disabled={isPending}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
              placeholder="e.g. ROOM-01"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80 uppercase">
              ROW CODE
            </label>
            <input
              type="text"
              disabled={isPending}
              value={rowCode}
              onChange={(e) => setRowCode(e.target.value)}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
              placeholder="e.g. ROW-01"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground/80 uppercase">
              POSITION
            </label>
            <input
              type="text"
              disabled={isPending}
              value={positionCode}
              onChange={(e) => setPositionCode(e.target.value)}
              className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan"
              placeholder="e.g. P-01"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-mono text-xs text-muted-foreground/80">
            CABINET NOTES (optional)
          </label>
          <textarea
            disabled={isPending}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-background border border-[#25304A] text-foreground rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-cyan min-h-20 max-h-40 resize-y"
            placeholder="Structural specifications or mounting comments..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#25304A] pt-4 mt-6">
          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="px-4 py-2 text-xs font-mono rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-xs font-mono rounded-lg bg-cyan text-primary-foreground font-semibold hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition disabled:opacity-50"
          >
            {isPending
              ? "SAVING..."
              : rackId
                ? "SAVE CHANGES"
                : "REGISTER CABINET"}
          </button>
        </div>
      </form>
    </ModalLayout>
  );
}
