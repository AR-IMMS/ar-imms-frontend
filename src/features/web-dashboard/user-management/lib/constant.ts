import type { RoleCode, UserStatus } from "@/types/auth";

export const ROLE_COLORS: Record<RoleCode, string> = {
  IT_ADMINISTRATOR: "bg-purple/15 text-purple border-purple/30 light:bg-purple/70 light:text-destructive-foreground",
  MAINTENANCE_TECHNICIAN: "bg-cyan/10 text-cyan border-cyan/30 light:bg-cyan/60 light:text-destructive-foreground",
  SYSTEM_MONITORING_OPERATOR: "bg-electric/15 text-cyan-ice border-electric/30 light:bg-electric/70 light:text-destructive-foreground",
};

export const USER_STATUS_TONE_CLASSES: Record<UserStatus, string> = {
  ACTIVE: "text-neon-green light:font-bold",
  INACTIVE: "text-amber light:font-bold",
  LOCKED: "text-critical light:font-bold",
};
