"use client";

import { useCurrentUser } from "@/hooks/auth/use-auth-query";
import { useAuth } from "@/hooks/auth/use-auth";

export function AuthBootstrap() {
  const { hasHydrated, isAuthenticated } = useAuth();
  useCurrentUser(hasHydrated && isAuthenticated);

  return null;
}
