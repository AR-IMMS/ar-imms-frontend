export type PermissionCode =
  | 'incidents.read'
  | 'incidents.create'
  | 'tickets.read'
  | 'tickets.create'
  | 'tickets.assign'
  | 'tickets.status.update'
  | 'tickets.comment'
  | 'tickets.evidence.attach'
  | 'tickets.acknowledge'
  | 'tickets.work.start'
  | 'tickets.resolve'
  | 'tickets.close'
  | 'tickets.cancel';

export type RoleCode =
  | 'IT_ADMINISTRATOR'
  | 'SYSTEM_MONITORING_OPERATOR'
  | 'MAINTENANCE_TECHNICIAN';

export interface AuthUser {
  id: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: RoleCode[];
  permissions: PermissionCode[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  user: AuthUser;
}

export interface AuthEnvelope {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
  };
  user?: Partial<AuthUser> & {
    id?: string;
    userId?: string;
    roleCodes?: RoleCode[];
  };
}
