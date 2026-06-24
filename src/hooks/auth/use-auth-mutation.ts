import { queryClient } from "@/lib/react-query/query-client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { authService } from "@/services/auth/auth-service";
import { useAuthStore } from "@/stores/auth-store";
import {
  AuthTokens,
  LoginRequestPayload,
  LoginResponse,
  RefreshTokenRequestPayload,
  UserProfileResponse,
} from "@/types/auth";
import { useMutation } from "@tanstack/react-query";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequestPayload) => authService.login(payload),
    onSuccess: (data: LoginResponse) => {
      useAuthStore.getState().login(data);
      queryClient.setQueryData<UserProfileResponse | null>(
        queryKeys.auth.currentUser(),
        data.user,
      );
    },
  });
}

export function useRefreshTokenMutation() {
  return useMutation({
    mutationFn: (payload: RefreshTokenRequestPayload) =>
      authService.refreshToken(payload),
    onSuccess: (tokens: AuthTokens) => {
      useAuthStore.getState().setTokens(tokens);
    },
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      useAuthStore.getState().logout();
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
