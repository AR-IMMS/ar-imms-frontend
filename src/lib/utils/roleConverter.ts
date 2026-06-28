import { RoleCode } from "@/types/auth";

const ROLE_NAME_MAP: Record<RoleCode, string> = {
  IT_ADMINISTRATOR: "Administrator",
  MAINTENANCE_TECHNICIAN: "Technician",
  SYSTEM_MONITORING_OPERATOR: "Operator",
};

/**
 * Chuyển đổi một mã vai trò (RoleCode) đơn lẻ thành tên hiển thị rút gọn
 */
export function getRoleName(roleCode: RoleCode | undefined): string {
  if (!roleCode) return "N/A";
  return ROLE_NAME_MAP[roleCode] ?? roleCode.replace(/_/g, " ");
}

/**
 * Chuyển đổi một mảng các mã vai trò thành mảng các tên hiển thị rút gọn
 */
export function formatRoleCodes(roleCodes: RoleCode[]): string[] {
  if (!Array.isArray(roleCodes)) return [];
  return roleCodes.map((code) => getRoleName(code));
}

/**
 * Chuyển mảng thành một chuỗi nối nhau bằng dấu phẩy
 * Ví dụ: ["IT_ADMINISTRATOR", "MAINTENANCE_TECHNICIAN"] -> "Administrator, Technician"
 */
export function formatRoleCodesToLabel(
  roleCodes: RoleCode[],
  separator = ", ",
): string {
  return formatRoleCodes(roleCodes).join(separator);
}
