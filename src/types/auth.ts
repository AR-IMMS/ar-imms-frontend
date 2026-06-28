export const AUTH_HEADERS = {
  SKIP_AUTH_INJECTION: "X-Skip-Auth-Injection",
  SKIP_AUTH_REFRESH: "X-Skip-Auth-Refresh",
  AUTH_RETRY: "X-Ky-Auth-Retry",
} as const;

export const AUTH_ERROR_CODES = new Set([
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "MISSING_TOKEN",
  "UNAUTHORIZED",
]);

export type RoleCode =
  | "IT_ADMINISTRATOR"
  | "MAINTENANCE_TECHNICIAN"
  | "SYSTEM_MONITORING_OPERATOR";

export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export type PermissionCode =
  | "identity.users.manage"
  | "audit.trail.read"
  | "topology.nodes.manage"
  | "topology.structure.manage"
  | "markers.manage"
  | "alert.rules.manage"
  | "dashboard.read"
  | "assets.health.read"
  | "telemetry.history.read"
  | "alerts.queue.read"
  | "incidents.create"
  | "tickets.dispatch"
  | "ar.inspections.conduct"
  | "ar.assets.identify"
  | "ar.diagnostics.read"
  | "ar.inspection-results.submit"
  | "simulation.scenarios.run"
  | "simulation.faults.inject";

export const USER_PERMISSION = {
  IDENTITY_USERS_MANAGE: "identity.users.manage",
  AUDIT_TRAIL_READ: "audit.trail.read",
  TOPOLOGY_NODES_MANAGE: "topology.nodes.manage",
  TOPOLOGY_STRUCTURE_MANAGE: "topology.structure.manage",
  MARKERS_MANAGE: "markers.manage",
  ALERT_RULES_MANAGE: "alert.rules.manage",
  DASHBOARD_READ: "dashboard.read",
  ASSETS_HEALTH_READ: "assets.health.read",
  TELEMETRY_HISTORY_READ: "telemetry.history.read",
  ALERTS_QUEUE_READ: "alerts.queue.read",
  INCIDENTS_CREATE: "incidents.create",
  TICKETS_DISPATCH: "tickets.dispatch",
  AR_INSPECTIONS_CONDUCT: "ar.inspections.conduct",
  AR_ASSETS_IDENTIFY: "ar.assets.identify",
  AR_DIAGNOSTICS_READ: "ar.diagnostics.read",
  AR_INSPECTION_RESULTS_SUBMIT: "ar.inspection-results.submit",
  SIMULATION_SCENARIOS_RUN: "simulation.scenarios.run",
  SIMULATION_FAULTS_INJECT: "simulation.faults.inject",
} as const;

export interface ROLE_ITEM {
  code: RoleCode;
  name: string;
  description: string;
  permissionCodes: PermissionCode[];
  isSystem: boolean;
}

export interface USER {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  avatarUrl?: string;
  roleCodes: RoleCode[];
  status: UserStatus;
  permissions?: PermissionCode[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfileResponse;
  tokens: AuthTokens;
}

export interface RefreshTokenRequestPayload {
  sessionId: string;
  refreshToken: string;
}

export interface ChangePasswordRequestPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileResponse extends USER {
  mustChangePassword: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequestPayload {
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  jobTitle?: string;
  department: string;
  avatarUrl?: string;
  roleCodes: RoleCode[];
}
