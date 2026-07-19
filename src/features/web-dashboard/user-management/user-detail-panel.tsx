"use client";

import {
  ChevronDown,
  KeyRound,
  Mail,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import type {
  USER,
  RoleCode,
  UserStatus,
  UserProfileResponse,
} from "@/types/auth";
import { useUpdateUserStatusMutation } from "@/hooks/identity/use-identity-mutations";
import { ROLE_COLORS, USER_STATUS_TONE_CLASSES } from "./lib/constant";
import { useUserByIdQuery } from "@/hooks/identity/use-identity-queries";
import Stat from "@/components/common/stat";
import CopyableUserId from "@/components/common/copyable-user-id";

type UserDetailPanelProps = {
  user: USER;
  onClose: () => void;
  roleNameMap: Map<RoleCode, string>;
};

function getUserStatusAction(status: UserStatus): {
  label: string;
  nextStatus: UserStatus;
  icon: typeof UserPlus;
} {
  if (status === "ACTIVE") {
    return {
      label: "Deactivate Account",
      nextStatus: "INACTIVE",
      icon: UserMinus,
    };
  }

  return {
    label: "Activate Account",
    nextStatus: "ACTIVE",
    icon: UserPlus,
  };
}

export default function UserDetailPanel({
  user,
  onClose,
  roleNameMap,
}: UserDetailPanelProps) {
  const detailQuery = useUserByIdQuery(user.id);
  const updateStatusMutation = useUpdateUserStatusMutation();

  const detailUser = detailQuery.data ?? (user as UserProfileResponse);
  const currentStatusAction = getUserStatusAction(detailUser.status);

  function handleStatusUpdate(nextStatus: UserStatus) {
    updateStatusMutation.mutate({
      userId: detailUser.id,
      payload: { status: nextStatus },
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass relative h-full w-full max-w-md overflow-y-auto border-l border-cyan/20 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="label-mono text-[10px] text-cyan-ice light:text-primary light:font-bold">
              OPERATOR PROFILE
            </div>
            <div className="title-display mt-1 text-lg text-foreground">
              {detailUser.fullName || "N/A"}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {detailUser.email || "N/A"}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              Last Login: {detailUser.lastLoginAt ?? "-"}
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/5">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* User Details */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Username" value={detailUser.username || "N/A"} mono />
          <div className="panel p-3 light:bg-muted">
            <div className="label-mono text-[9px] text-muted-foreground">
              Operator ID
            </div>
            <CopyableUserId value={detailUser.id} className="mt-1" />
          </div>
          <Stat
            label="Department"
            value={detailUser.department || "N/A"}
            mono
          />
          <Stat label="Phone No" value={detailUser.phoneNumber || "N/A"} mono />
          <Stat
            label="Status"
            value={detailUser.status || "N/A"}
            mono
            tone={USER_STATUS_TONE_CLASSES[detailUser.status as UserStatus]}
          />
          <Stat
            label="Need Password Change"
            value={detailUser.mustChangePassword ? "YES" : "NO"}
            mono
            tone={
              detailUser.mustChangePassword ? "text-amber light:font-bold" : "text-neon-green light:font-bold"
            }
          />
        </div>

        {/* user roles */}
        <div className="mt-6">
          <div className="mb-2 label-mono text-[10px] text-muted-foreground">
            Role Assignment
          </div>
          <div className="flex flex-col gap-2">
            {detailUser.roleCodes.length > 0 ? (
              detailUser.roleCodes.map((roleCode: RoleCode) => {
                const colorClass =
                  ROLE_COLORS[roleCode] ??
                  "border-white/10 bg-white/5 text-muted-foreground";

                return (
                  <button
                    key={roleCode}
                    type="button"
                    className={`w-fit rounded-md border p-2.5 text-left transition ${colorClass}`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-3.5 shrink-0" />
                      <span className="label-mono whitespace-nowrap text-[10px] font-medium text-foreground light:text-destructive-foreground">
                        {roleNameMap.get(roleCode) ??
                          roleCode.replace(/_/g, " ")}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                No roles assigned
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="panel mt-6 space-y-2 p-4">
          <div className="label-mono text-[10px] text-cyan-ice">
            Quick Actions
          </div>

          {/* Resend Activation Email */}
          <button
            type="button"
            disabled={
              detailUser.status === "LOCKED" || updateStatusMutation.isPending
            }
            className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30 hover:light:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-xs text-foreground">
              <Mail className="size-3.5 text-cyan" /> Resend Activation Email
            </span>
            <ChevronDown className="-rotate-90 size-3 text-muted-foreground" />
          </button>

          {/* Force Password Reset */}
          <button
            type="button"
            disabled={
              detailUser.status === "LOCKED" || updateStatusMutation.isPending
            }
            className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30 hover:light:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-xs text-foreground">
              <KeyRound className="size-3.5 text-amber" /> Force Password Reset
            </span>
            <ChevronDown className="-rotate-90 size-3 text-muted-foreground" />
          </button>

          {/* Update User Status */}
          <button
            type="button"
            onClick={() => handleStatusUpdate(currentStatusAction.nextStatus)}
            disabled={updateStatusMutation.isPending}
            className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30 hover:light:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-xs text-foreground">
              {user.status === "ACTIVE" ? (
                <>
                  <UserMinus className="size-3.5 text-amber" />
                  Deactivate Account
                </>
              ) : (
                // Trường hợp "INACTIVE" hoặc "LOCKED" đều hiển thị nút Activate
                <>
                  <UserPlus className="size-3.5 text-neon-green" />
                  Activate Account
                </>
              )}
            </span>
            <ChevronDown className="-rotate-90 size-3 text-muted-foreground" />
          </button>

          {/* Lock Account */}
          <button
            type="button"
            onClick={() => handleStatusUpdate("LOCKED")}
            disabled={
              detailUser.status === "LOCKED" || updateStatusMutation.isPending
            }
            className={`inline-flex w-full items-center justify-between rounded-md border border-critical/30 bg-critical/10 px-3 py-2 transition ${
              detailUser.status === "LOCKED" || updateStatusMutation.isPending
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-critical/20"
            }`}
          >
            <span className="inline-flex items-center gap-2 text-xs text-critical">
              <X className="size-3.5" />
              Lock Account
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
