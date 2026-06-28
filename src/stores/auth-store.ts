import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import type {
  LoginResponse,
  AuthTokens,
  UserProfileResponse,
} from "@/types/auth";

interface AuthState {
  user: Partial<UserProfileResponse> | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  hasHydrated: boolean;

  login: (data: LoginResponse | null) => void;
  logout: () => void;
  setTokens: (tokens: Partial<AuthTokens> | null) => void;
  setUser: (user: Partial<UserProfileResponse> | null) => void;
  setHasHydrated: (value: boolean) => void;
}

type PersistedAuthState = Pick<
  AuthState,
  "user" | "accessToken" | "refreshToken" | "sessionId"
>;

const createFallbackStorage = (): StateStorage => {
  const storage = new Map<string, string>();

  return {
    getItem: (name) => storage.get(name) ?? null,
    setItem: (name, value) => {
      storage.set(name, value);
    },
    removeItem: (name) => {
      storage.delete(name);
    },
  };
};

const createBrowserStorage = (): StateStorage => {
  if (typeof window === "undefined") {
    return createFallbackStorage();
  }

  return {
    getItem: (name) => window.localStorage.getItem(name),
    setItem: (name, value) => {
      window.localStorage.setItem(name, value);
    },
    removeItem: (name) => {
      window.localStorage.removeItem(name);
    },
  };
};

export const useAuthStore = create<AuthState>()(
  persist<AuthState, [], [], PersistedAuthState>(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      hasHydrated: false,

      login: (data) =>
        set({
          user: data?.user ?? null,
          accessToken: data?.tokens.accessToken ?? null,
          refreshToken: data?.tokens.refreshToken ?? null,
          sessionId: data?.tokens.sessionId ?? null,
        }),
      setTokens: (tokens) =>
        set((state) => ({
          accessToken: tokens?.accessToken ?? state.accessToken,
          refreshToken: tokens?.refreshToken ?? state.refreshToken,
          sessionId: tokens?.sessionId ?? state.sessionId,
        })),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionId: null,
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage<PersistedAuthState>(createBrowserStorage),
      partialize: (state): PersistedAuthState => ({
        user: state.user
          ? {
              id: state.user.id,
              username: state.user.username,
              avatarUrl: state.user.avatarUrl,
              roleCodes: state.user.roleCodes,
            }
          : null,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
