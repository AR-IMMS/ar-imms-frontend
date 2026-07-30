"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/use-auth";
import { hasAnyRole, hasRole } from "@/lib/auth/auth-permissions";
import type { UserProfileResponse } from "@/types/auth";

type TicketRouteGuardProps = {
  children: ReactNode;
};

export function OperatorTicketRouteGuard({ children }: TicketRouteGuardProps) {
  const router = useRouter();
  const { hasHydrated, user } = useAuth();
  const profile = user as UserProfileResponse | null;
  const canManageTickets = hasAnyRole(profile, [
    "IT_ADMINISTRATOR",
    "SYSTEM_MONITORING_OPERATOR",
  ]);
  const isTechnician = hasRole(profile, "MAINTENANCE_TECHNICIAN");

  useEffect(() => {
    if (!hasHydrated || canManageTickets) {
      return;
    }

    if (isTechnician) {
      router.replace("/tickets/me");
      return;
    }

    router.replace("/403");
  }, [canManageTickets, hasHydrated, isTechnician, router]);

  if (!hasHydrated || !canManageTickets) {
    return null;
  }

  return children;
}

export function AssignedTicketRouteGuard({ children }: TicketRouteGuardProps) {
  const router = useRouter();
  const { hasHydrated, user } = useAuth();
  const profile = user as UserProfileResponse | null;
  const canViewAssignedTickets = hasAnyRole(profile, [
    "IT_ADMINISTRATOR",
    "SYSTEM_MONITORING_OPERATOR",
    "MAINTENANCE_TECHNICIAN",
  ]);

  useEffect(() => {
    if (!hasHydrated || canViewAssignedTickets) {
      return;
    }

    router.replace("/403");
  }, [canViewAssignedTickets, hasHydrated, router]);

  if (!hasHydrated || !canViewAssignedTickets) {
    return null;
  }

  return children;
}
