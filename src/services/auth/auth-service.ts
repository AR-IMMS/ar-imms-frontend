import { z } from 'zod';
import { httpGet, httpPost } from '@/lib/http/http-methods';
import { AUTH_ENDPOINTS } from '@/lib/react-query/api-endpoint';
import type {
  AuthTokens,
  ChangePasswordRequestPayload,
  LoginRequestPayload,
  LoginResponse,
  RefreshTokenRequestPayload,
  UserProfileResponse,
} from '@/types/auth';
import { mapCoreProfile } from './core-profile';
import { coreOrigin } from '@/lib/http/core-origin';

const identity = { service: 'identity' as const };
const usesCoreBrowserAuth =
  process.env.NEXT_PUBLIC_CORE_BROWSER_AUTH === 'true';
const core = () => ({
  ...identity,
  prefix: coreOrigin(process.env.NEXT_PUBLIC_TICKET_API_URL),
  context: { core: true },
  retry: { limit: 1, methods: [] },
});
const browser = () => ({
  ...core(),
  credentials: 'include' as const,
  context: { core: true, skipAuth: true },
});
const sessionDto = z.object({
  access_token: z.string().min(1),
  csrf_token: z.string().min(1),
  must_change_password: z.boolean().optional(),
});
let csrf: string | null = null;
const browserPath = '/api/v1/auth/browser';
function browserTokens(value: unknown): AuthTokens {
  const session = sessionDto.parse(value);
  csrf = session.csrf_token;
  return {
    accessToken: session.access_token,
    refreshToken: null,
    sessionId: null,
  };
}

export const authService = {
  usesCoreBrowserAuth,
  login: async (payload: LoginRequestPayload): Promise<LoginResponse> => {
    if (!usesCoreBrowserAuth)
      return httpPost(AUTH_ENDPOINTS.LOGIN, payload, {
        ...identity,
        skipAuthHooks: true,
      });
    const session = sessionDto.parse(
      await httpPost<unknown>(
        browserPath + '/login',
        { identifier: payload.email.trim(), password: payload.password },
        browser()
      )
    );
    const tokens = browserTokens(session);
    try {
      if (session.must_change_password)
        throw {
          status: 403,
          code: 'PASSWORD_CHANGE_REQUIRED',
          message:
            'Complete your required password change before signing in to the Dashboard.',
        };
      const user = mapCoreProfile(
        await httpGet<unknown>(AUTH_ENDPOINTS.ME, {
          ...browser(),
          headers: { Authorization: 'Bearer ' + tokens.accessToken },
        })
      );
      return { user, tokens };
    } catch (error) {
      await authService.logout().catch(() => {});
      throw error;
    }
  },
  refreshToken: async (
    payload: RefreshTokenRequestPayload
  ): Promise<AuthTokens> => {
    if (!usesCoreBrowserAuth)
      return httpPost(AUTH_ENDPOINTS.REFRESH, payload, {
        ...identity,
        skipAuthHooks: true,
        credentials: 'include',
      });
    if (!csrf) throw new Error('Sign in again to restore the browser session.');
    return browserTokens(
      await httpPost<unknown>(browserPath + '/refresh', undefined, {
        ...browser(),
        headers: { 'X-CSRF-Token': csrf },
      })
    );
  },
  logout: async (): Promise<{ success: true }> => {
    if (!usesCoreBrowserAuth)
      return httpPost(AUTH_ENDPOINTS.LOGOUT, undefined, identity);
    if (csrf)
      await httpPost(browserPath + '/logout', undefined, {
        ...browser(),
        headers: { 'X-CSRF-Token': csrf },
      });
    csrf = null;
    return { success: true };
  },
  getCurrentUser: async (): Promise<UserProfileResponse> => {
    if (!usesCoreBrowserAuth) return httpGet(AUTH_ENDPOINTS.ME, identity);
    return mapCoreProfile(await httpGet<unknown>(AUTH_ENDPOINTS.ME, core()));
  },
  changePassword: (
    payload: ChangePasswordRequestPayload
  ): Promise<{ success: true; reauthenticationRequired: true }> =>
    httpPost(AUTH_ENDPOINTS.CHANGE_PASSWORD, payload, identity),
};
