export interface NodeLeaf {
  id: string;
  nodeCode: string;
  displayName: string;
}

export interface RackGroup {
  id: string;
  rackCode: string;
  displayName: string;
  nodes: NodeLeaf[];
}

export interface RoomGroup {
  roomCode: string;
  displayName: string;
  racks: RackGroup[];
}

export interface SiteGroup {
  siteCode: string;
  displayName: string;
  rooms: Record<string, RoomGroup>;
}

export interface HierarchicalTreeProps {
  maxLevel?: "rack" | "node";
  searchPlaceholder?: string;
  autoExpandToNodeCode?: string | null;
  containerClassName?: string;
  panelClassName?: string;
  emptyStateText?: string;
}
