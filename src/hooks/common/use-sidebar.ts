import { useSidebarStore } from "@/stores/sidebar-store";

export function useSidebar() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const hasHydrated = useSidebarStore((state) => state.hasHydrated);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);

  return {
    isCollapsed: hasHydrated ? isCollapsed : false,
    realIsCollapsed: isCollapsed,
    hasHydrated,
    toggleSidebar,
    setCollapsed,
  };
}
