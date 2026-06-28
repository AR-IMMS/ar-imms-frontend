import { httpGet, httpPost } from "@/lib/http/http-methods";
import { AUTH_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import type {
  AuthTokens,
  ChangePasswordRequestPayload,
  LoginRequestPayload,
  LoginResponse,
  RefreshTokenRequestPayload,
  UserProfileResponse,
} from "@/types/auth";

const SERVICE_NAME = "identity";

export const authService = {
  login: (payload: LoginRequestPayload): Promise<LoginResponse> =>
    httpPost<LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload, {
      skipAuthHooks: true,
      service: SERVICE_NAME,
    }),

  refreshToken: (payload: RefreshTokenRequestPayload): Promise<AuthTokens> =>
    httpPost<AuthTokens>(AUTH_ENDPOINTS.REFRESH, payload, {
      skipAuthHooks: true,
      credentials: "include",
      service: SERVICE_NAME,
    }),

  logout: (): Promise<{ success: true }> =>
    httpPost<{ success: true }>(AUTH_ENDPOINTS.LOGOUT, undefined, {
      skipAuthHooks: true,
      service: SERVICE_NAME,
    }),

  getCurrentUser: (): Promise<UserProfileResponse> =>
    httpGet<UserProfileResponse>(AUTH_ENDPOINTS.ME, {
      service: SERVICE_NAME,
    }),

  changePassword: (
    payload: ChangePasswordRequestPayload,
  ): Promise<{ success: true; reauthenticationRequired: true }> =>
    httpPost<{ success: true; reauthenticationRequired: true }>(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      payload,
      { service: SERVICE_NAME },
    ),
};
