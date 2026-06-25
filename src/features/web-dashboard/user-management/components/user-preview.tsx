"use client";

import { ShieldCheck, User } from "lucide-react";
import type { RoleCode } from "@/types/auth";
import { ROLE_COLORS } from "../lib/constant";
import { AVAILABLE_ROLES } from "./role-selector";

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
  // Generate initials for preview avatar
  const previewInitials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "OP";

  return (
    <div className="hidden flex-col bg-[#141B2D]/55 p-6 md:col-span-5 md:flex">
      <div className="label-mono text-[10px] text-cyan-ice tracking-wider">
        REALTIME DIAGNOSTICS // VISUAL COMPLIANCE
      </div>
      <h3 className="title-display mt-1 text-sm text-foreground">
        Operator Profile Preview
      </h3>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground leading-relaxed">
        Immediate inspection state matching control plane record rendering formatting.
      </p>

      {/* Preview Card */}
      <div className="panel mt-6 flex flex-col items-center bg-[#111827]/90 p-5 shadow-lg border-[#25304A]">
        {/* Profile Pic or Initials */}
        {avatarUrl.trim() ? (
          <img
            src={avatarUrl.trim()}
            alt="Avatar preview"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
            className="size-16 rounded-full border-2 border-[#25304A] object-cover bg-[#0b1020]"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full border-2 border-[#25304A] bg-gradient-to-br from-cyan/20 to-purple/20 text-lg font-bold text-foreground">
            {previewInitials}
          </div>
        )}

        {/* Name & Job Title */}
        <div className="mt-4 text-center">
          <h4 className="title-display text-sm text-foreground truncate max-w-[200px]">
            {fullName.trim() || "Unspecified Operator"}
          </h4>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {jobTitle.trim() || "Role Unassigned"}
          </p>
        </div>

        {/* Active Badge */}
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded border border-[#00ff9c]/30 bg-[#00ff9c]/10 px-2.5 py-0.5 text-[9px] font-mono font-medium text-[#00ff9c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00ff9c]" />
            ACTIVE PREVIEW
          </span>
        </div>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-[#25304A]" />

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
              YES (REQUIRED)
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
          <div className="rounded-lg border border-dashed border-[#25304A] p-4 text-center font-mono text-[10px] text-muted-foreground">
            No operational security roles checked.
          </div>
        )}
      </div>

      {/* Diagnostic Footer */}
      <div className="mt-auto border-t border-[#25304A] pt-4 flex items-center gap-2 text-muted-foreground font-mono text-[9px]">
        <User className="size-3.5 text-cyan" />
        <span>STATUS STAGED // CACHE FLUSH READY</span>
      </div>
    </div>
  );
}
