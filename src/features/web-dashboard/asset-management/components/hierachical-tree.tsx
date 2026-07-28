"use client";

import CommonHierarchicalTree from "@/components/common/hierarchical-tree";

export default function HierarchicalTreeSidebar() {
  return (
    <CommonHierarchicalTree
      maxLevel="rack"
      searchPlaceholder="Search by code, name..."
    />
  );
}
