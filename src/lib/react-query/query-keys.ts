import type { ListUsersRequest } from "@/types/users";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: () => ["auth", "current-user"] as const,
  },
  identity: {
    all: ["identity"] as const,
    roles: () => ["identity", "roles"] as const,
    users: {
      all: ["identity", "users"] as const,
      list: (params: ListUsersRequest) =>
        ["identity", "users", "list", params] as const,
      detailById: (userId: string) =>
        ["identity", "users", "detail", userId] as const,
      detailByUsername: (
        username: string,
        params?: Partial<ListUsersRequest>,
      ) => ["identity", "users", "detail", username, params ?? {}] as const,
    },
  },
} as const;
