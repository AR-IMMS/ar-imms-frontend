"use client";

import { Search, X } from "lucide-react";
import type { RoleCode, UserStatus } from "@/types/auth";

type MenuKey = "role" | "status" | null;

type RoleOption = {
  code: RoleCode;
  name: string;
};

type UserListFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  roleOptions: RoleOption[];
  selectedRole: RoleCode | "ALL";
  selectedRoleLabel: string;
  selectedStatus: UserStatus | "ALL";
  onSelectRole: (role: RoleCode | "ALL") => void;
  onSelectStatus: (status: UserStatus | "ALL") => void;
  openMenu: MenuKey;
  setOpenMenu: (menu: MenuKey) => void;
};

const STATUS_OPTIONS: Array<UserStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
  "LOCKED",
];

export default function UserListFilters({
  search,
  onSearchChange,
  roleOptions,
  selectedRole,
  selectedRoleLabel,
  selectedStatus,
  onSelectRole,
  onSelectStatus,
  openMenu,
  setOpenMenu,
}: UserListFiltersProps) {
  const selectedRoleChipLabel =
    selectedRole === "ALL" ? "All roles" : selectedRoleLabel;
  const selectedStatusChipLabel =
    selectedStatus === "ALL" ? "All statuses" : selectedStatus;

  return (
    <div className="panel light:bg-accent space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-9 min-w-65 flex-1 items-center gap-2 rounded-md border border-cyan/15 bg-surface-1 light:bg-muted px-3">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, email, or UserID..."
            className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </label>

        <div className="relative">
          <button
            type="button"
            aria-expanded={openMenu === "role"}
            onClick={() => setOpenMenu(openMenu === "role" ? null : "role")}
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs transition ${
              selectedRole !== "ALL"
                ? "border-cyan/40 bg-cyan/10 light:bg-primary/75 hover:light:bg-primary/85"
                : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30 hover:light:border-muted-foreground/50 hover:light:bg-surface-1/85"
            }`}
          >
            <span
              className={`label-mono text-[10px] ${selectedRole !== "ALL" ? " light:text-white" : ""}`}
            >
              Role
            </span>
            <span className="label-mono light:text-white text-[10px]">
              {selectedRole === "ALL" ? "All" : selectedRoleLabel}
            </span>
            <span
              className={`label-mono text-[10px] ${selectedRole !== "ALL" ? " light:text-white" : ""}`}
            >
              ▾
            </span>
          </button>

          {openMenu === "role" ? (
            <div className="absolute left-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-lg border border-cyan/30 bg-surface-2 light:bg-muted shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <button
                type="button"
                onClick={() => onSelectRole("ALL")}
                className="flex w-full items-center justify-between border-b border-border/60 px-3 py-2 text-left text-muted-foreground transition hover:bg-white/5"
              >
                <span className="label-mono">All Roles</span>
              </button>
              <div className="max-h-56 overflow-auto py-1">
                {roleOptions.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-muted-foreground">
                    No roles available.
                  </div>
                ) : (
                  roleOptions.map((role) => {
                    const isSelected = selectedRole === role.code;

                    return (
                      <button
                        key={role.code}
                        type="button"
                        onClick={() => onSelectRole(role.code)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
                          isSelected
                            ? "bg-cyan/10 text-cyan-ice"
                            : "text-foreground hover:bg-white/5"
                        }`}
                      >
                        <span className="label-mono">{role.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-expanded={openMenu === "status"}
            onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs transition ${
              selectedStatus !== "ALL"
                ? "border-cyan/40 bg-cyan/10 light:bg-primary/75 hover:light:bg-primary/85"
                : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30 hover:light:border-muted-foreground/50 hover:light:bg-surface-1/85"
            }`}
          >
            <span
              className={`label-mono text-[10px] ${selectedStatus !== "ALL" ? " light:text-white" : ""}`}
            >
              Status
            </span>
            <span
              className={`label-mono text-[10px] ${selectedStatus !== "ALL" ? " light:text-white" : ""}`}
            >
              {selectedStatus === "ALL" ? "All" : selectedStatus}
            </span>
            <span
              className={`label-mono text-[10px] ${selectedStatus !== "ALL" ? " light:text-white" : ""}`}
            >
              ▾
            </span>
          </button>

          {openMenu === "status" ? (
            <div className="absolute left-0 top-full z-20 mt-2 w-35 overflow-hidden rounded-lg border border-cyan/30 bg-surface-2 light:bg-muted shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <button
                type="button"
                onClick={() => onSelectStatus("ALL")}
                className="flex w-full items-center justify-between border-b border-border/60 px-3 py-2 text-left text-[11px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                <span className="label-mono">All Statuses</span>
              </button>
              <div className="py-1">
                {STATUS_OPTIONS.filter((status) => status !== "ALL").map(
                  (status) => {
                    const isSelected = selectedStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onSelectStatus(status)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] transition ${
                          isSelected
                            ? "bg-cyan/10 text-cyan-ice"
                            : "text-foreground hover:bg-white/5"
                        }`}
                      >
                        <span className="label-mono">{status}</span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-1 px-3 text-xs text-muted-foreground opacity-50"
        >
          <span className="label-mono text-[10px]">Dept: Disabled</span>
          <span className="label-mono text-[10px]">▾</span>
        </button>
      </div>

      {/* filter selection */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedRole !== "ALL" ? (
          <button
            type="button"
            onClick={() => onSelectRole("ALL")}
            className="inline-flex items-center gap-2 rounded-md border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-[10px] text-cyan-ice transition hover:border-cyan/50 hover:light:border-muted-foreground light:bg-primary/75 hover:light:bg-primary/85"
          >
            <span className="label-mono light:text-background">
              Role: {selectedRoleChipLabel}
            </span>
            <X className="size-3.5 light:text-background" />
          </button>
        ) : null}

        {selectedStatus !== "ALL" ? (
          <button
            type="button"
            onClick={() => onSelectStatus("ALL")}
            className="inline-flex items-center gap-2 rounded-md border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-[10px] text-cyan-ice transition hover:border-cyan/50 hover:light:border-muted-foreground light:bg-primary/75 hover:light:bg-primary/85"
          >
            <span className="label-mono light:text-background">
              Status: {selectedStatusChipLabel}
            </span>
            <X className="size-3.5 light:text-background" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
