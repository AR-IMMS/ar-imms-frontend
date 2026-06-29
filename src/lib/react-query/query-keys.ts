import type { ListUsersRequest } from "@/types/users";
import type { ListTicketsParams } from "@/types/ticket";

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
  tickets: {
    all: ["tickets"] as const,
    lists: () => ["tickets", "list"] as const,
    list: (params?: ListTicketsParams) =>
      ["tickets", "list", params ?? {}] as const,
    detail: (ticketId: string) => ["tickets", "detail", ticketId] as const,
    evidence: (ticketId: string) => ["tickets", "evidence", ticketId] as const,
    technicians: () => ["tickets", "technicians"] as const,
  },
} as const;
