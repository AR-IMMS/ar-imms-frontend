"use client";

import type { RoleCode } from "@/types/auth";

// Role options with display details
export const AVAILABLE_ROLES: Array<{
  code: RoleCode;
  name: string;
  description: string;
}> = [
  {
    code: "SYSTEM_MONITORING_OPERATOR",
    name: "System Monitoring Operator",
    description: "Monitors systems telemetry, view alerts queue, and reads dashboards.",
  },
  {
    code: "MAINTENANCE_TECHNICIAN",
    name: "Maintenance Technician",
    description: "Conducts AR inspections, identifies assets, and resolves work tickets.",
  },
  {
    code: "IT_ADMINISTRATOR",
    name: "IT Administrator",
    description: "Full control plane access, manages users, audit trails, and rules.",
  },
];

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  department?: string;
  roleCodes?: string;
  apiError?: string;
}

interface RoleSelectorProps {
  selectedRoles: RoleCode[];
  onRoleToggle: (role: RoleCode) => void;
  errors: FormErrors;
  isPending: boolean;
}

export default function RoleSelector({
  selectedRoles,
  onRoleToggle,
  errors,
  isPending,
}: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="title-display text-[10px] tracking-wider text-cyan-ice">
          Assigned Security Roles <span className="text-[#ff4d6d]">*</span>
        </h3>
        {errors.roleCodes && (
          <span className="text-[10px] text-[#ff4d6d]">{errors.roleCodes}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {AVAILABLE_ROLES.map((role) => {
          const isChecked = selectedRoles.includes(role.code);

          return (
            <div
              key={role.code}
              onClick={() => !isPending && onRoleToggle(role.code)}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-150 ${
                isChecked
                  ? `border-cyan/60 bg-cyan/10 text-foreground`
                  : "border-border bg-background hover:border-cyan/30 hover:bg-surface-3/40"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isPending}
                onChange={() => {}} // Controlled by wrapper div click
                className="accent-cyan mt-1.5 h-3.5 w-3.5 cursor-pointer rounded border-border bg-background"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {role.name}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground leading-relaxed">
                  {role.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
