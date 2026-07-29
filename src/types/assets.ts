export type AssetType = "rack" | "node" | "marker";

export type RackLifecycleState =
  | "CREATED"
  | "READY"
  | "ACTIVE"
  | "DRAINING"
  | "RETIRED";

export type RackCapacityState = "AVAILABLE" | "EXPANDING" | "FULL";

export type NodeLifecycleState =
  | "DISCOVERED"
  | "READY"
  | "ACTIVE"
  | "DRAINING"
  | "RETIRED";

export type NodeAssignmentState = "UNASSIGNED" | "ASSIGNED" | "MOVED";

export type PendingAssignmentNodeOrigin = "mongo" | "redis";

export type MarkerTargetType = "rack" | "node";

export type MarkerLifecycleState =
  | "DRAFT"
  | "GENERATED"
  | "PRINTED"
  | "MOUNTED"
  | "VALIDATED"
  | "ACTIVE"
  | "REMAPPED"
  | "RETIRED";

export interface RackEntity {
  id: string;
  rackCode: string;
  displayName: string;
  lifecycleState: RackLifecycleState;
  capacityState: RackCapacityState;
  siteCode?: string;
  roomCode?: string;
  rowCode?: string;
  positionCode?: string;
  capacityLimit?: number;
  notes?: string;
  vendor?: string;
  metadata: Record<string, unknown>;
}

export interface NodeEntity {
  id: string;
  nodeCode: string;
  displayName: string;
  hostname?: string;
  rackId?: string;
  positionCode?: string;
  nodeType?: string;
  source: string;
  lifecycleState: NodeLifecycleState;
  assignmentState: NodeAssignmentState;
  serialNumber?: string;
  vendor?: string;
  model?: string;
  managementIp?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface MarkerEntity {
  id: string;
  markerCode: string;
  displayLabel?: string;
  lifecycleState: MarkerLifecycleState;
  targetType?: MarkerTargetType;
  targetId?: string;
  bindingStatus: string;
  isActive: boolean;
  isVisibleInAr: boolean;
  imageTargetId?: string;
  worldTrackingEnabled: boolean;
  lastValidatedAt?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface DiscoveredNodeHardwareEntity {
  primaryIpv4?: string;
  macAddress?: string;
  hardwareSerial?: string;
  vendor?: string;
  model?: string;
  osProduct?: string;
  logicalCpuCount?: number;
  cpuArchitecture?: string;
}

export interface DiscoveredNodeEntity {
  agentId: string;
  hostname: string;
  deviceType: string;
  source?: string;
  lifecycleState: NodeLifecycleState;
  assignmentState: NodeAssignmentState;
  hardware: DiscoveredNodeHardwareEntity;
  createdAt?: string;
  updatedAt?: string;
  registeredAt?: string;
  siteCode?: string;
  logicalRackId?: string | null;
}

export interface PendingAssignmentNodeView {
  nodeCode: string;
  displayName: string;
  hostname: string;
  nodeType: string;
  source: string;
  lifecycleState: NodeLifecycleState;
  assignmentState: NodeAssignmentState;
  origin: PendingAssignmentNodeOrigin;
  discoveredNode?: DiscoveredNodeEntity;
  siteCode?: string;
  logicalRackId?: string | null;
}

export interface AssetSummary {
  id: string;
  type: AssetType;
  code: string;
  name: string;
  lifecycleState?: string;
}

export interface RackTopologyResult {
  rack: RackEntity;
  nodes: NodeEntity[];
}

export interface NodeContextResult {
  node: NodeEntity;
  rack?: RackEntity;
  markers: MarkerEntity[];
  topologyPath: { rackId?: string; rackCode?: string };
  externalContext: { workloadSource: "monitoring-service-or-bff" };
}

export interface CreateRackRequestDto {
  rackCode: string;
  displayName: string;
  siteCode?: string;
  roomCode?: string;
  rowCode?: string;
  positionCode?: string;
  capacityLimit?: number;
  vendor?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateRackRequestDto {
  rackCode?: string;
  displayName?: string;
  capacityState?: RackCapacityState;
  siteCode?: string;
  roomCode?: string;
  rowCode?: string;
  positionCode?: string;
  capacityLimit?: number;
  vendor?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateNodeRequestDto {
  nodeCode?: string;
  rackId?: string;
  displayName?: string;
  source?: string;
  hostname?: string;
  nodeType?: string;
  serialNumber?: string;
  vendor?: string;
  model?: string;
  managementIp?: string;
  positionCode?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface AssignNodeToRackRequestDto {
  rackId: string;
  positionCode: string;
  allowDraining?: boolean;
}

// export interface MarkerResolutionResult {
//   marker: MarkerEntity;
//   target: AssetSummary;
//   rack?: RackEntity;
//   node?: NodeEntity;
//   runtimeSnapshot?: NodeRuntimeSnapshotEntity;
//   topologyPath: { rackId?: string; rackCode?: string };
//   externalContext: { workloadSource: "monitoring-service-or-bff" };
// }

// export interface CreateMarkerRequestDto {
//   markerCode: string;
//   displayLabel?: string;
//   targetType?: MarkerTargetType;
//   targetId?: string;
//   imageTargetId?: string;
//   worldTrackingEnabled?: boolean;
//   notes?: string;
//   metadata?: Record<string, unknown>;
// }

// export interface UpdateMarkerRequestDto {
//   markerCode?: string;
//   displayLabel?: string;
//   imageTargetId?: string;
//   worldTrackingEnabled?: boolean;
//   notes?: string;
//   metadata?: Record<string, unknown>;
// }

// export interface RemapMarkerTargetRequestDto {
//   targetType: MarkerTargetType;
//   targetId: string;
// }
