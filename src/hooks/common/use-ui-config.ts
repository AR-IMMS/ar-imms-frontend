import { useUiConfigStore } from "@/stores/ui-config-store";

export function useSidebar() {
  const isCollapsed = useUiConfigStore((state) => state.isCollapsed);
  const hasHydrated = useUiConfigStore((state) => state.hasHydrated);
  const toggleSidebar = useUiConfigStore((state) => state.toggleSidebar);
  const setCollapsed = useUiConfigStore((state) => state.setCollapsed);

  return {
    isCollapsed: hasHydrated ? isCollapsed : false,
    realIsCollapsed: isCollapsed,
    hasHydrated,
    toggleSidebar,
    setCollapsed,
  };
}
