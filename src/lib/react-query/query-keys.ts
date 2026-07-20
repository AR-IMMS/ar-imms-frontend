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
  asset: {
    all: ["asset"] as const,
    topologyTree: () => ["asset", "topology"] as const,
    rackTopology: (rackId: string) =>
      ["asset", "topology", "rack", rackId] as const,
    nodeContext: (nodeId: string) =>
      ["asset", "node", "context", nodeId] as const,
    assetByCode: (code: string) => ["asset", "detail", "code", code] as const,
    resolveMarker: (markerCode: string) =>
      ["asset", "marker", "resolve", markerCode] as const,
    search: (params?: { q?: string; type?: string }) =>
      ["asset", "search", params ?? {}] as const,
    pendingAssignmentNodes: () =>
      ["asset", "pending-assignment-nodes"] as const,
  },
  monitoring: {
    all: ["monitoring"] as const,
    racks: {
      all: ["monitoring", "racks"] as const,
      overview: () => ["monitoring", "racks", "overview"] as const,
      // state: () => ["monitoring", "racks", "state"] as const,
    },
  },
} as const;
