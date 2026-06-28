import { httpGet, httpPatch, httpPost, httpPut } from "@/lib/http/http-methods";
import { IDENTITY_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import buildQueryString from "@/lib/utils/buildQueryString";
import { PaginatedResponse } from "@/types/api";
import type {
  CreateUserRequestPayload,
  ROLE_ITEM,
  UserProfileResponse,
} from "@/types/auth";
import {
  GetUserByUsernameRequest,
  ListUsersRequest,
  UpdateUserRolesRequestPayload,
  UpdateUserStatusRequestPayload,
} from "@/types/users";

export const identityService = {
  getRoles: (): Promise<ROLE_ITEM[]> =>
    httpGet<ROLE_ITEM[]>(IDENTITY_ENDPOINTS.GET_ROLES, {
      includeAuth: false,
    }),

  listUsers: (
    params: ListUsersRequest,
  ): Promise<PaginatedResponse<UserProfileResponse>> =>
    httpGet<PaginatedResponse<UserProfileResponse>>(
      `${IDENTITY_ENDPOINTS.GET_USERS}${buildQueryString(params)}`,
    ),

  getUserByUsername: (
    params: GetUserByUsernameRequest,
  ): Promise<PaginatedResponse<UserProfileResponse>> =>
    httpGet<PaginatedResponse<UserProfileResponse>>(
      `${IDENTITY_ENDPOINTS.GET_USER_BY_USERNAME(params.username)}${buildQueryString(params)}`,
    ),

  getUserById: (userId: string): Promise<UserProfileResponse> =>
    httpGet<UserProfileResponse>(IDENTITY_ENDPOINTS.GET_USER_BY_ID(userId)),

  createUser: (
    payload: CreateUserRequestPayload,
  ): Promise<UserProfileResponse> =>
    httpPost<UserProfileResponse>(IDENTITY_ENDPOINTS.CREATE_USERS, payload),

  updateUserStatus: (
    userId: string,
    payload: UpdateUserStatusRequestPayload,
  ): Promise<UserProfileResponse> =>
    httpPatch<UserProfileResponse>(
      IDENTITY_ENDPOINTS.UPDATE_USER_STATUS(userId),
      payload,
    ),

  updateUserRoles: (
    userId: string,
    payload: UpdateUserRolesRequestPayload,
  ): Promise<UserProfileResponse> =>
    httpPut<UserProfileResponse>(
      IDENTITY_ENDPOINTS.UPDATE_USER_ROLES(userId),
      payload,
    ),
};
