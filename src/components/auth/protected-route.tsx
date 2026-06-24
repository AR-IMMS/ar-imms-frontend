"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/use-auth";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
} from "@/lib/auth/auth-permissions";
import type {
  PermissionCode,
  RoleCode,
  UserProfileResponse,
} from "@/types/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: string;
  requiredRoles?: readonly RoleCode[];
  requiredPermissions?: readonly PermissionCode[];
  requireAllPermissions?: boolean;
};

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  requiredRoles,
  requiredPermissions,
  requireAllPermissions = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const hasHydrated = useAuth().hasHydrated;
  const isAuthenticated = useAuth().isAuthenticated;
  const user = useAuth().user as UserProfileResponse | null;

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !hasAnyRole(user, requiredRoles)
    ) {
      router.replace("/403");
      return;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const allowed = requireAllPermissions
        ? hasAllPermissions(user, requiredPermissions)
        : hasAnyPermission(user, requiredPermissions);

      if (!allowed) {
        router.replace("/403");
      }
    }
  }, [
    hasHydrated,
    isAuthenticated,
    redirectTo,
    requiredPermissions,
    requiredRoles,
    requireAllPermissions,
    router,
    user,
  ]);

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  if (
    requiredRoles &&
    requiredRoles.length > 0 &&
    !hasAnyRole(user, requiredRoles)
  ) {
    return null;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const allowed = requireAllPermissions
      ? hasAllPermissions(user, requiredPermissions)
      : hasAnyPermission(user, requiredPermissions);

    if (!allowed) {
      return null;
    }
  }

  return children;
}
