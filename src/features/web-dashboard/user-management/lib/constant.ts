import { RoleCode } from "@/types/auth";

export const ROLE_COLORS: Record<RoleCode, string> = {
  IT_ADMINISTRATOR: "bg-purple/15 text-purple border-purple/30",
  MAINTENANCE_TECHNICIAN: "bg-cyan/10 text-cyan border-cyan/30",
  SYSTEM_MONITORING_OPERATOR: "bg-electric/15 text-cyan-ice border-electric/30",
};