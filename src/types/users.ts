import { PaginationParams } from './api';
import type { RoleCode, UserStatus } from './auth';

export type ListUsersRequest = PaginationParams;

export type GetUsersRequest = ListUsersRequest;

export interface UpdateUserStatusRequestPayload {
  status: UserStatus;
}

export interface UpdateUserRolesRequestPayload {
  roleCodes: RoleCode[];
}
