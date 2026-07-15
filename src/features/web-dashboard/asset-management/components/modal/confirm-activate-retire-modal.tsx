"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAssetStore } from "../../hooks/useAssetStore";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import {
  useActivateRackMutation,
  useRetireRackMutation,
  useActivateNodeMutation,
  useRetireNodeMutation,
} from "@/hooks/asset/use-asset-mutations";
import ModalLayout from "@/components/layout/modal-layout";

export default function ConfirmRetireModal() {
  const { lifecycleModalState, setLifecycleModalState } = useAssetStore();
  const isOpen = !!lifecycleModalState;
  const entityType = lifecycleModalState?.entityType ?? null;
  const entityId = lifecycleModalState?.entityId ?? "";
  const action = lifecycleModalState?.action ?? "retire";
  const displayName = lifecycleModalState?.displayName ?? "";

  const activateRack = useActivateRackMutation();
  const retireRack = useRetireRackMutation();
  const activateNode = useActivateNodeMutation();
  const retireNode = useRetireNodeMutation();

  const isPending =
    activateRack.isPending ||
    retireRack.isPending ||
    activateNode.isPending ||
    retireNode.isPending;

  if (!isOpen) return null;

  const handleClose = () => {
    if (isPending) return;
    setLifecycleModalState(null);
  };

  const handleConfirm = () => {
    const successCallback = () => {
      toast.success(
        `${entityType === "rack" ? "Rack" : "Node"} successfully ${
          action === "activate" ? "activated" : "retired"
        }.`,
      );
      handleClose();
    };

    const errorCallback = (err: Error) => {
      toast.error(err.message || `Failed to transition state`);
    };

    if (entityType === "rack") {
      if (action === "activate") {
        activateRack.mutate(entityId, {
          onSuccess: successCallback,
          onError: errorCallback,
        });
      } else {
        retireRack.mutate(entityId, {
          onSuccess: successCallback,
          onError: errorCallback,
        });
      }
    } else {
      if (action === "activate") {
        activateNode.mutate(entityId, {
          onSuccess: successCallback,
          onError: errorCallback,
        });
      } else {
        retireNode.mutate(entityId, {
          onSuccess: successCallback,
          onError: errorCallback,
        });
      }
    }
  };

  const isRetire = action === "retire";

  return (
    <ModalLayout
      onClose={handleClose}
      eyebrow="UPDATE LIFECYCLE STATE"
      title={
        isRetire
          ? `${entityType?.toUpperCase()}: ${displayName}`
          : `${entityType?.toUpperCase()}: ${displayName}`
      }
      isPending={isPending}
      maxWidth="max-w-md"
    >
      <div className="p-6 space-y-6">
        {isRetire ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0" />
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                ARE YOU SURE YOU WANT TO RETIRE THIS {entityType}?
              </div>
              <p className="text-[11px] font-mono text-foreground/70 leading-relaxed">
                You are about to retire {entityType} {displayName}. Any
                associated data or metrics will no longer be tracked.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
            <div className="space-y-1.5">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Are you sure you want to activate this {entityType}?
              </div>
              <p className="text-[11px] font-mono text-foreground/70 leading-relaxed">
                Activate {entityType} {displayName} will make it available for
                monitoring and data collection. Data metrics will begin loading
                dynamically.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between border-b border-[#25304A]/60 pb-1.5 text-xs font-mono text-foreground/50">
            <span>TARGET COMPONENT:</span>
            <span className="text-foreground font-bold">
              {entityType?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between border-b border-[#25304A]/60 pb-1.5 text-xs font-mono text-foreground/50">
            <span>HARDWARE ID:</span>
            <span className="text-foreground font-bold font-mono">
              {entityId}
            </span>
          </div>
          <div className="flex justify-between text-xs font-mono text-foreground/50">
            <span>ACTION TYPE:</span>
            <span
              className={
                isRetire
                  ? "text-red-400 font-bold"
                  : "text-emerald-400 font-bold"
              }
            >
              {action.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#25304A] pt-4">
          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="px-4 py-2 text-xs font-mono rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-mono rounded-lg font-semibold transition ${
              isRetire
                ? "bg-red-500 text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "bg-emerald-500 text-primary-foreground hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            }`}
          >
            {isPending ? "COMPLETING..." : "CONFIRM ACTION"}
          </button>
        </div>
      </div>
    </ModalLayout>
  );
}
