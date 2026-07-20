"use client";

import { ShieldCheck } from "lucide-react";
import type { RoleCode } from "@/types/auth";
import { ROLE_COLORS } from "../lib/constant";
import { AVAILABLE_ROLES } from "./role-selector";
import { Avatar } from "@/components/common/avatar";

interface UserPreviewProps {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  department: string;
  avatarUrl: string;
  selectedRoles: RoleCode[];
}

export default function UserPreview({
  fullName,
  username,
  email,
  phoneNumber,
  jobTitle,
  department,
  avatarUrl,
  selectedRoles,
}: UserPreviewProps) {
  return (
    <div className="hidden flex-col bg-surface-2/55 p-6 md:col-span-5 md:flex">
      <div className="label-mono text-[10px] text-cyan-ice tracking-wider">
        {"// VISUAL COMPLIANCE"}
      </div>
      <h3 className="title-display mt-1 text-sm text-foreground">
        Operator Profile Preview
      </h3>

      {/* Preview Card */}
      <div className="panel mt-6 flex flex-col items-center bg-surface-1/90 p-5 shadow-lg border-border">
        {/* Profile Pic or Initials */}
        <Avatar
          avatarUrl={avatarUrl.trim() || null}
          fullName={fullName.trim() || "Unspecified Operator"}
          variant="circle"
        />

        {/* Name & Job Title */}
        <div className="mt-4 text-center">
          <h4 className="title-display text-sm text-foreground truncate max-w-[200px]">
            {fullName.trim() || "Unspecified Operator"}
          </h4>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {jobTitle.trim() || "Title Unassigned"}
          </p>
        </div>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-border" />

        {/* User attributes */}
        <div className="w-full space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase">Username:</span>
            <span className="text-foreground text-[11px] font-bold">
              {username.trim() ? `@${username.trim()}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase">Email:</span>
            <span className="text-foreground text-[11px] truncate max-w-[150px] text-right" title={email}>
              {email.trim() || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase">Dept:</span>
            <span className="text-foreground text-[11px] truncate max-w-[150px] text-right">
              {department.trim() || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase">Phone:</span>
            <span className="text-foreground text-[11px]">
              {phoneNumber.trim() || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] uppercase">Reset Pwd:</span>
            <span className="text-amber text-[10px] font-bold tracking-wider">
              REQUIRED
            </span>
          </div>
        </div>
      </div>

      {/* Roles Subpanel */}
      <div className="mt-5 flex-1">
        <div className="label-mono text-[9px] text-muted-foreground mb-2">
          Assigned Authority
        </div>
        {selectedRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedRoles.map((roleCode) => {
              const colorClass =
                ROLE_COLORS[roleCode] ??
                "border-white/10 bg-white/5 text-muted-foreground";
              const roleDetails = AVAILABLE_ROLES.find((r) => r.code === roleCode);

              return (
                <span
                  key={roleCode}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] ${colorClass}`}
                >
                  <ShieldCheck className="size-2.5 shrink-0" />
                  {roleDetails?.name || roleCode.replace(/_/g, " ")}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center font-mono text-[10px] text-muted-foreground">
            No operational security roles checked.
          </div>
        )}
      </div>
    </div>
  );
}
