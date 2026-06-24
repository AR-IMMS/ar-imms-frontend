import { USER_PERMISSION } from "@/types/auth";
import type { PermissionCode, RoleCode, UserProfileResponse } from "@/types/auth";

export function hasPermission(
  user: UserProfileResponse | null,
  permission: PermissionCode,
): boolean {
  return user?.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(
  user: UserProfileResponse | null,
  permissions: readonly PermissionCode[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasAllPermissions(
  user: UserProfileResponse | null,
  permissions: readonly PermissionCode[],
): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

export function hasRole(
  user: UserProfileResponse | null,
  role: RoleCode,
): boolean {
  return user?.roleCodes.includes(role) ?? false;
}

export function hasAnyRole(
  user: UserProfileResponse | null,
  roles: readonly RoleCode[],
): boolean {
  return roles.some((role) => hasRole(user, role));
}

export function isAdminUser(user: UserProfileResponse | null): boolean {
  return hasRole(user, "IT_ADMINISTRATOR");
}

export { USER_PERMISSION };

