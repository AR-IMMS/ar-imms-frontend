export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: () => ["auth", "current-user"] as const,
  },
  user: {
    list: (params: object) => ["users", "list", params] as const,
    detail: (id: number) => ["users", "detail", id] as const,
  },
} as const;
