import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth/auth-service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { RoleCode } from "@/types/auth";

const DEFAULT_AUTH_STALE_TIME = 5 * 60_000; // 5 mins

export function useCurrentUser(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled,
    staleTime: DEFAULT_AUTH_STALE_TIME,
  });

  useEffect(() => {
    if (query.data) {
      useAuthStore.getState().setUser(query.data);
    }
  }, [query.data]);

  return query;
}

export function useUserRole() {
  return useAuthStore((state) => state.user?.roleCodes ?? []);
}

export function useUserAvatar() {
  return useAuthStore((state) => state.user?.avatarUrl ?? null);
}

export function useHasRole(role: RoleCode) {
  return useUserRole().includes(role);
}
