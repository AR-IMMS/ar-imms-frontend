"use client";

import CommonHierarchicalTree from "@/components/common/hierarchical-tree";

export default function MonitoringHierarchicalTree() {
  return (
    <CommonHierarchicalTree
      maxLevel="node"
      searchPlaceholder="Search by code, name..."
      containerClassName="relative h-full py-4 pl-4 flex flex-col select-none border-border bg-background/50 backdrop-blur-md shrink-0"
      panelClassName="w-64"
      emptyStateText="No infrastructure matched"
    />
  );
}
