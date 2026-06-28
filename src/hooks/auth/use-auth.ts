import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const sessionId = useAuthStore((state) => state.sessionId);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore(
    (state) => !!state.accessToken && !!state.refreshToken,
  );

  return {
    user,
    accessToken,
    refreshToken,
    sessionId,
    hasHydrated,
    isAuthenticated,
  };
}

export function useAuthActions() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    login,
    logout,
    setTokens,
    setUser,
  };
}
