import { httpGet, httpPost } from "@/lib/http/http-methods";
import { AUTH_ENDPOINTS } from "@/types/auth";
import type {
  AuthTokens,
  ChangePasswordRequestPayload,
  LoginRequestPayload,
  LoginResponse,
  RefreshTokenRequestPayload,
  UserProfileResponse,
} from "@/types/auth";

export const authService = {
  login: (payload: LoginRequestPayload): Promise<LoginResponse> =>
    httpPost<LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload, {
      skipAuthHooks: true,
    }),

  refreshToken: (
    payload: RefreshTokenRequestPayload,
  ): Promise<AuthTokens> =>
    httpPost<AuthTokens>(AUTH_ENDPOINTS.REFRESH, payload, {
      skipAuthHooks: true,
      credentials: "include",
    }),

  logout: (): Promise<{ success: true }> =>
    httpPost<{ success: true }>(AUTH_ENDPOINTS.LOGOUT, undefined, {
      skipAuthHooks: true,
    }),

  getCurrentUser: (): Promise<UserProfileResponse> =>
    httpGet<UserProfileResponse>(AUTH_ENDPOINTS.ME),

  changePassword: (
    payload: ChangePasswordRequestPayload,
  ): Promise<{ success: true; reauthenticationRequired: true }> =>
    httpPost<{ success: true; reauthenticationRequired: true }>(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      payload,
    ),
};
