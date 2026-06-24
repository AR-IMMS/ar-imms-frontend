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
import type { RoleCode, UserProfileResponse } from "@/types/auth";
import { ROLE_COLORS } from "./lib/constant";

export default function UserDetailPanel({
  user,
  onClose,
}: {
  user: UserProfileResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass relative h-full w-full max-w-md overflow-y-auto border-l border-cyan/20 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="label-mono text-[10px] text-cyan-ice">
              OPERATOR PROFILE
            </div>
            <div className="title-display text-lg text-foreground mt-1">
              {user.fullName ?? user.username}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {user.email}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              Last Login: {user.lastLoginAt ?? "-"}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Username" value={user.username || "N/A"} mono />
          <Stat label="Operator ID" value={user.id} mono />
          <Stat label="Department" value={user.department || "N/A"} mono />
          <Stat label="Phone No" value={user.phoneNumber || "N/A"} mono />
          <Stat
            label="Status"
            value={user.status}
            mono
            tone={
              user.status === "ACTIVE"
                ? "text-neon-green"
                : user.status === "LOCKED"
                  ? "text-critical"
                  : "text-amber"
            }
          />
          <Stat
            label="Need Password Change"
            value={user.mustChangePassword ? "YES" : "NO"}
            mono
            tone={user.mustChangePassword ? "text-amber" : "text-neon-green"}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 label-mono text-[10px] text-muted-foreground">
            Role Assignment
          </div>
          <div className="flex flex-col gap-2">
            {user.roleCodes.map((r) => {
              const colorClass =
                ROLE_COLORS[r as RoleCode] ||
                "border-white/10 bg-white/5 text-muted-foreground";

              return (
                <button
                  key={r}
                  className={`w-fit text-left p-2.5 rounded-md border transition ${colorClass}`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-3.5 shrink-0" />
                    <span className="label-mono text-[10px] text-foreground font-medium whitespace-nowrap">
                      {r.replace(/_/g, " ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel mt-6 space-y-2 p-4">
          <div className="label-mono text-[10px] text-cyan-ice">
            Quick Actions
          </div>
          <button className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30">
            <span className="inline-flex items-center gap-2 text-xs text-foreground">
              <Mail className="size-3.5 text-cyan" /> Resend Activation Email
            </span>
            <ChevronDown className="-rotate-90 size-3 text-muted-foreground" />
          </button>
          <button className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30">
            <span className="inline-flex items-center gap-2 text-xs text-foreground">
              <KeyRound className="size-3.5 text-amber" /> Force Password Reset
            </span>
            <ChevronDown className="-rotate-90 size-3 text-muted-foreground" />
          </button>

          <button className="inline-flex w-full items-center justify-between rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30">
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

          <button
            disabled={user.status === "LOCKED"}
            className={`inline-flex w-full items-center justify-between rounded-md border border-critical/30 bg-critical/10 px-3 py-2 transition ${
              user.status === "LOCKED"
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-critical/20"
            }`}
          >
            <span className="inline-flex items-center gap-2 text-xs text-critical">
              <X className="size-3.5" /> Lock Account
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div className="panel p-3">
      <div className="label-mono text-[9px] text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${tone || "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
