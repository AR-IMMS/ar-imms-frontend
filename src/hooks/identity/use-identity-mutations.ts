import { useMutation } from '@tanstack/react-query';
import { identityService } from '@/services/identity/identity-service';
import { queryClient } from '@/lib/react-query/query-client';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import type { ListResponse } from '@/types/api';
import type {
  CreateUserRequestPayload,
  UserProfileResponse,
} from '@/types/auth';
import {
  UpdateUserRolesRequestPayload,
  UpdateUserStatusRequestPayload,
} from '@/types/users';

type UsersListQueryParams = typeof queryKeys.identity.users.list extends (
  ...args: infer Args
) => unknown
  ? Args[0]
  : never;

type CreateUserMutationContext = {
  optimisticUserId: string;
  previousListQueries: Array<
    [readonly unknown[], ListResponse<UserProfileResponse> | undefined]
  >;
};

function isPaginatedUserResponse(
  value: unknown
): value is ListResponse<UserProfileResponse> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray((value as ListResponse<UserProfileResponse>).data)
  );
}

function syncUpdatedUserCaches(updatedUser: UserProfileResponse) {
  queryClient.setQueriesData(
    { queryKey: queryKeys.identity.users.all },
    (cachedData: unknown) => {
      if (!cachedData) {
        return cachedData;
      }

      if (isPaginatedUserResponse(cachedData)) {
        return {
          ...cachedData,
          data: cachedData.data.map((user) =>
            user.id === updatedUser.id ? { ...user, ...updatedUser } : user
          ),
        };
      }

      if (
        typeof cachedData === 'object' &&
        cachedData !== null &&
        'id' in cachedData &&
        (cachedData as { id?: string }).id === updatedUser.id
      ) {
        return {
          ...cachedData,
          ...updatedUser,
        };
      }

      return cachedData;
    }
  );

  const currentUser = queryClient.getQueryData<UserProfileResponse | null>(
    queryKeys.auth.currentUser()
  );

  if (currentUser?.id === updatedUser.id) {
    queryClient.setQueryData(queryKeys.auth.currentUser(), updatedUser);
    useAuthStore.getState().setUser(updatedUser);
  }
}

function createOptimisticUser(
  payload: CreateUserRequestPayload
): UserProfileResponse {
  const now = new Date().toISOString();

  return {
    id: `temp-user-${Date.now()}`,
    username: payload.username,
    email: payload.email,
    fullName: payload.fullName,
    phoneNumber: payload.phoneNumber,
    jobTitle: payload.jobTitle,
    department: payload.department,
    avatarUrl: payload.avatarUrl,
    roleCodes: payload.roleCodes,
    status: 'ACTIVE',
    mustChangePassword: false,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function isUsersListQueryKey(queryKey: readonly unknown[]): boolean {
  return (
    queryKey[0] === 'identity' &&
    queryKey[1] === 'users' &&
    queryKey[2] === 'list' &&
    typeof queryKey[3] === 'object' &&
    queryKey[3] !== null
  );
}

function matchesUsersListFilters(
  _user: UserProfileResponse,
  _params: UsersListQueryParams
): boolean {
  return true;
}

function insertOptimisticUserIntoList(
  data: ListResponse<UserProfileResponse>,
  optimisticUser: UserProfileResponse,
  params: UsersListQueryParams
): ListResponse<UserProfileResponse> {
  const nextItems = [
    optimisticUser,
    ...data.data.filter((item) => item.id !== optimisticUser.id),
  ];

  return {
    ...data,
    data: params.cursor ? data.data : nextItems,
  };
}

function replaceOptimisticUserInList(
  data: ListResponse<UserProfileResponse>,
  optimisticUserId: string,
  createdUser: UserProfileResponse,
  params: UsersListQueryParams
): ListResponse<UserProfileResponse> {
  const nextItems = data.data.map((item) =>
    item.id === optimisticUserId ? createdUser : item
  );

  if (params.cursor) {
    return data;
  }

  return {
    ...data,
    data: nextItems,
  };
}

function syncCreatedUserCaches(
  createdUser: UserProfileResponse,
  optimisticUserId: string
) {
  const listQueries = queryClient.getQueriesData<
    ListResponse<UserProfileResponse>
  >({ queryKey: queryKeys.identity.users.all });

  for (const [queryKey, cachedData] of listQueries) {
    if (!cachedData || !isUsersListQueryKey(queryKey)) {
      continue;
    }

    const params = queryKey[3] as UsersListQueryParams;

    if (!matchesUsersListFilters(createdUser, params)) {
      continue;
    }

    queryClient.setQueryData(
      queryKey,
      replaceOptimisticUserInList(
        cachedData,
        optimisticUserId,
        createdUser,
        params
      )
    );
  }

  queryClient.setQueryData(
    queryKeys.identity.users.detailById(createdUser.id),
    createdUser
  );
}

export function useCreateUserMutation() {
  return useMutation({
    mutationFn: (payload: CreateUserRequestPayload) =>
      identityService.createUser(payload),
    onMutate: async (payload): Promise<CreateUserMutationContext> => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.identity.users.all,
      });

      const optimisticUser = createOptimisticUser(payload);
      const previousListQueries = queryClient.getQueriesData<
        ListResponse<UserProfileResponse>
      >({ queryKey: queryKeys.identity.users.all });

      for (const [queryKey, cachedData] of previousListQueries) {
        if (!cachedData || !isUsersListQueryKey(queryKey)) {
          continue;
        }

        const params = queryKey[3] as UsersListQueryParams;

        if (!matchesUsersListFilters(optimisticUser, params)) {
          continue;
        }

        queryClient.setQueryData(
          queryKey,
          insertOptimisticUserIntoList(cachedData, optimisticUser, params)
        );
      }

      return {
        optimisticUserId: optimisticUser.id,
        previousListQueries,
      };
    },
    onError: (_error, _payload, context) => {
      if (!context) {
        return;
      }

      for (const [queryKey, cachedData] of context.previousListQueries) {
        queryClient.setQueryData(queryKey, cachedData);
      }
    },
    onSuccess: (createdUser, _payload, context) => {
      syncCreatedUserCaches(createdUser, context?.optimisticUserId ?? '');
    },
  });
}

export function useUpdateUserStatusMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateUserStatusRequestPayload;
    }): Promise<UserProfileResponse> =>
      identityService.updateUserStatus(userId, payload),
    onSuccess: (updatedUser) => {
      syncUpdatedUserCaches(updatedUser);
    },
  });
}

export function useUpdateUserRolesMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateUserRolesRequestPayload;
    }): Promise<UserProfileResponse> =>
      identityService.updateUserRoles(userId, payload),
    onSuccess: (updatedUser) => {
      syncUpdatedUserCaches(updatedUser);
    },
  });
}
