import type { RoleCode, UserStatus } from "@/types/auth";

export const ROLE_COLORS: Record<RoleCode, string> = {
  IT_ADMINISTRATOR: "bg-purple/15 text-purple border-purple/30",
  MAINTENANCE_TECHNICIAN: "bg-cyan/10 text-cyan border-cyan/30",
  SYSTEM_MONITORING_OPERATOR: "bg-electric/15 text-cyan-ice border-electric/30",
};

export const USER_STATUS_TONE_CLASSES: Record<UserStatus, string> = {
  ACTIVE: "text-neon-green",
  INACTIVE: "text-amber",
  LOCKED: "text-critical",
};
