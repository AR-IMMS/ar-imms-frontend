import { PaginationParams } from "./api";
import { RoleCode, UserStatus } from "./auth";

export interface ListUsersRequest extends PaginationParams {
  username?: string;
  email?: string;
  status?: UserStatus;
  roleCodes?: RoleCode[];
};

export type GetUserByUsernameRequest = ListUsersRequest & 
  Required<Pick<ListUsersRequest, "username">>;

export type GetUsersRequest = ListUsersRequest;

export interface UpdateUserStatusRequestPayload {
  status: UserStatus;
}

export interface UpdateUserRolesRequestPayload {
  roleCodes: RoleCode[];
}
