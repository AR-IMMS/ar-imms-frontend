import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  hasHydrated: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

type PersistedSidebarState = Pick<SidebarState, "isCollapsed">;

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

export const useSidebarStore = create<SidebarState>()(
  persist<SidebarState, [], [], PersistedSidebarState>(
    (set) => ({
      isCollapsed: false,
      hasHydrated: false,

      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "sidebar-store",
      storage: createJSONStorage<PersistedSidebarState>(createBrowserStorage),
      partialize: (state): PersistedSidebarState => ({
        isCollapsed: state.isCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
