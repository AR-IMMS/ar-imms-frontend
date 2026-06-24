import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth/auth-service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { RoleCode } from "@/types/auth";

export function useCurrentUser(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled,
    staleTime: 5 * 60_000, // 5 mins
  });

  useEffect(() => {
    if (query.data) {
      useAuthStore.getState().setUser(query.data);
    }
  }, [query.data]);

  return query;
}

export function useUserRole() {
  return useAuthStore.getState().user?.roleCodes ?? [];
}

export function useUserAvatar() {
  return useAuthStore.getState().user?.avatarUrl ?? null;
}

export function useHasRole(role: RoleCode) {
  return useUserRole().includes(role);
}
