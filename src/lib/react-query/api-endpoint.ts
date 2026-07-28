export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
  CHANGE_PASSWORD: "/auth/change-password",
} as const;

export const IDENTITY_ENDPOINTS = {
  GET_ROLES: "/roles",
  CREATE_USERS: "/admin/users",
  GET_USERS: "/admin/users",
  GET_USER_BY_ID: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}`,
  GET_USER_BY_USERNAME: (username: string) =>
    `/admin/users/username/${encodeURIComponent(username)}`,
  UPDATE_USER_STATUS: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/status`,
  UPDATE_USER_ROLES: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}/roles`,
} as const;

export const ASSET_ENDPOINTS = {
  TOPOLOGY_TREE: "/topology/tree",
  RACK_TOPOLOGY: (rackId: string) =>
    `/racks/${encodeURIComponent(rackId)}/topology`,
  ASSET_BY_CODE: (code: string) =>
    `/assets/by-code/${encodeURIComponent(code)}`,
  SEARCH_ASSETS: "/assets/search",
  NODE_CONTEXT: (nodeId: string) =>
    `/nodes/${encodeURIComponent(nodeId)}/context`,
  RESOLVE_MARKER: (markerCode: string) =>
    `/markers/resolve/${encodeURIComponent(markerCode)}`,

  // Admin Topology
  ADMIN_RACKS: "/admin/topology/racks",
  ADMIN_RACK_BY_ID: (rackId: string) =>
    `/admin/topology/racks/${encodeURIComponent(rackId)}`,
  ACTIVATE_RACK: (rackId: string) =>
    `/admin/topology/racks/${encodeURIComponent(rackId)}/activate`,
  RETIRE_RACK: (rackId: string) =>
    `/admin/topology/racks/${encodeURIComponent(rackId)}/retire`,
  // DRAIN_RACK: (rackId: string) =>
  //   `/admin/topology/racks/${encodeURIComponent(rackId)}/drain`,
  // CONFIRM_READY_RACK: (rackId: string) =>
  //   `/admin/topology/racks/${encodeURIComponent(rackId)}/confirm-ready`,

  // NORMALIZE_NODE: "/admin/topology/nodes/normalize",
  // DISCOVERED_NODES: "/admin/topology/discovered-nodes",
  // UNASSIGNED_NODES: "/admin/topology/nodes/unassigned",
  PENDING_ASSIGNMENT_NODES: "/admin/topology/nodes/pending-assignment",
  ADMIN_NODE_BY_ID: (nodeId: string) =>
    `/admin/topology/nodes/${encodeURIComponent(nodeId)}`,
  ASSIGN_RACK: (nodeId: string) =>
    `/admin/topology/nodes/${encodeURIComponent(nodeId)}/assign`,
  ACTIVATE_NODE: (nodeId: string) =>
    `/admin/topology/nodes/${encodeURIComponent(nodeId)}/activate`,
  RETIRE_NODE: (nodeId: string) =>
    `/admin/topology/nodes/${encodeURIComponent(nodeId)}/retire`,
  // DRAIN_NODE: (nodeId: string) =>
  //   `/admin/topology/nodes/${encodeURIComponent(nodeId)}/drain`,

  // Admin Markers
  ADMIN_MARKERS: "/admin/markers",
  // ADMIN_MARKER_BY_ID: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}`,
  // GENERATE_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/generate`,
  // PRINT_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/print`,
  // MOUNT_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/mount`,
  // VALIDATE_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/validate`,
  // ACTIVATE_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/activate`,
  // REMAP_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/remap`,
  // RETIRE_MARKER: (markerId: string) =>
  //   `/admin/markers/${encodeURIComponent(markerId)}/retire`,
} as const;

export const MONITORING_ENDPOINTS = {
  RACKS_OVERVIEW: (rackId: string) =>
    `/monitoring/racks/${encodeURIComponent(rackId)}/overview`,
  NODE_OVERVIEW: (nodeCode: string) =>
    `/monitoring/nodes/${encodeURIComponent(nodeCode)}/overview`,
  NODE_METRICS: (nodeCode: string) =>
    `/monitoring/nodes/${encodeURIComponent(nodeCode)}/metrics`,
  NODE_METRICS_LIVE: (nodeCode: string) =>
    `/monitoring/nodes/${encodeURIComponent(nodeCode)}/metrics/live`,
} as const;
