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
  GET_USER_BY_ID: (userId: string) => `/admin/users/${encodeURIComponent(userId)}`,
  GET_USER_BY_USERNAME: (username: string) => `/admin/users/username/${encodeURIComponent(username)}`,
  UPDATE_USER_STATUS: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/status`,
  UPDATE_USER_ROLES: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/roles`,
} as const;