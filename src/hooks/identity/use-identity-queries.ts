import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { identityService } from "@/services/identity/identity-service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ListUsersRequest } from "@/types/users";

const DEFAULT_ROLES_STALE_TIME = 30 * 60_000;
const DEFAULT_USERS_STALE_TIME = 30_000;

export function useRolesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.identity.roles(),
    queryFn: () => identityService.getRoles(),
    enabled,
    staleTime: DEFAULT_ROLES_STALE_TIME,
  });
}

export function useUsersQuery(params: ListUsersRequest, enabled = true) {
  return useQuery({
    queryKey: queryKeys.identity.users.list(params),
    queryFn: () => identityService.listUsers(params),
    enabled,
    staleTime: DEFAULT_USERS_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useUserByIdQuery(userId: string, enabled = true) {
  const normalizedUserId = userId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.identity.users.detailById(normalizedUserId),
    queryFn: () => identityService.getUserById(normalizedUserId),
    enabled: enabled && normalizedUserId.length > 0,
    staleTime: DEFAULT_USERS_STALE_TIME,
  });
}

export function useUsersByUsernameQuery(
  username: string,
  params?: ListUsersRequest,
  enabled = true,
) {
  const normalizedUsername = username?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.identity.users.detailByUsername(normalizedUsername, params),
    queryFn: () =>
      identityService.getUserByUsername({
        username: normalizedUsername,
        ...params,
      }),
    enabled: enabled && normalizedUsername.length > 0,
    staleTime: DEFAULT_USERS_STALE_TIME,
  });
}
