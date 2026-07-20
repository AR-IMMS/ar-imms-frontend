import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export interface NavigationPathItem {
  id: string;
  name: string;
  type: "site" | "room" | "rack";
}

interface UiConfigState {
  isCollapsed: boolean;
  hasHydrated: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setHasHydrated: (value: boolean) => void;

  // Topology sub-sidebar collapsible states & actions
  isTopologyTreeCollapsed: boolean;
  activeNavigationPath: NavigationPathItem[];
  setTopologyTreeCollapsed: (collapsed: boolean) => void;
  toggleTopologyTree: () => void;
  setActiveNavigationPath: (path: NavigationPathItem[]) => void;

  // Theme state & actions
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

type PersistedUiConfigState = Pick<
  UiConfigState,
  "isCollapsed" | "isTopologyTreeCollapsed" | "theme"
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

export const useUiConfigStore = create<UiConfigState>()(
  persist<UiConfigState, [], [], PersistedUiConfigState>(
    (set) => ({
      isCollapsed: false,
      hasHydrated: false,
      isTopologyTreeCollapsed: false,
      activeNavigationPath: [],
      theme: "dark",

      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
      setHasHydrated: (value) => set({ hasHydrated: value }),

      setTopologyTreeCollapsed: (isTopologyTreeCollapsed) =>
        set({ isTopologyTreeCollapsed }),
      toggleTopologyTree: () =>
        set((state) => ({
          isTopologyTreeCollapsed: !state.isTopologyTreeCollapsed,
        })),
      setActiveNavigationPath: (activeNavigationPath) =>
        set({ activeNavigationPath }),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "ui-config-store",
      storage: createJSONStorage<PersistedUiConfigState>(createBrowserStorage),
      partialize: (state): PersistedUiConfigState => ({
        isCollapsed: state.isCollapsed,
        isTopologyTreeCollapsed: state.isTopologyTreeCollapsed,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);


