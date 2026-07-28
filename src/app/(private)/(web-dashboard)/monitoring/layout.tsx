"use client";

import MonitoringHierarchicalTree from "@/features/web-dashboard/monitoring/components/monitoring-hierarchical-tree";
import { ReactNode } from "react";
import { useUiConfigStore } from "@/stores/ui-config-store";
import { motion } from "framer-motion";

export default function MonitoringDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isTopologyTreeCollapsed } = useUiConfigStore();

  return (
    <div className="relative flex-1 flex items-stretch min-h-0 overflow-hidden w-full h-full">
      {/* Left Sidebar Tree */}
      <motion.aside
        initial={false}
        animate={{
          width: isTopologyTreeCollapsed ? "2.5%" : "17%",
          minWidth: isTopologyTreeCollapsed ? 0 : 240,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 shrink-0 flex flex-col overflow-visible h-full"
      >
        <MonitoringHierarchicalTree />
      </motion.aside>

      {/* Telemetry Viewport */}
      <main className="relative flex-1 min-w-0 overflow-hidden flex flex-col h-full w-full">
        {children}
      </main>
    </div>
  );
}
