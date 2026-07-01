import { httpGet, httpPost, httpPatch } from "@/lib/http/http-methods";
import { ASSET_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import buildQueryString from "@/lib/utils/buildQueryString";
import type {
  RackTopologyResult,
  AssetSummary,
  MarkerResolutionResult,
  RackEntity,
  NodeEntity,
  MarkerEntity,
  DiscoveredNodeEntity,
  CreateRackRequestDto,
  UpdateRackRequestDto,
  NormalizeNodeRequestDto,
  UpdateNodeRequestDto,
  AssignNodeToRackRequestDto,
  CreateMarkerRequestDto,
  UpdateMarkerRequestDto,
  RemapMarkerTargetRequestDto,
  NodeContextResult,
} from "@/types/assets";

const ASSET_SERVICE_NAME = "asset";

export const assetService = {
  // --- Queries ---
  getTopologyTree: (): Promise<RackTopologyResult[]> =>
    httpGet<RackTopologyResult[]>(ASSET_ENDPOINTS.TOPOLOGY_TREE, {
      service: ASSET_SERVICE_NAME,
    }),

  getRackTopology: (rackId: string): Promise<RackTopologyResult> =>
    httpGet<RackTopologyResult>(ASSET_ENDPOINTS.RACK_TOPOLOGY(rackId), {
      service: ASSET_SERVICE_NAME,
    }),

  getNodeContext: (nodeId: string): Promise<NodeContextResult> =>
    httpGet<NodeContextResult>(ASSET_ENDPOINTS.NODE_CONTEXT(nodeId), {
      service: ASSET_SERVICE_NAME,
    }),

  getAssetByCode: (code: string): Promise<AssetSummary> =>
    httpGet<AssetSummary>(ASSET_ENDPOINTS.ASSET_BY_CODE(code), {
      service: ASSET_SERVICE_NAME,
    }),

  resolveMarker: (markerCode: string): Promise<MarkerResolutionResult> =>
    httpGet<MarkerResolutionResult>(
      ASSET_ENDPOINTS.RESOLVE_MARKER(markerCode),
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  searchAssets: (params?: {
    q?: string;
    type?: string;
  }): Promise<AssetSummary[]> => {
    const queryString = params ? buildQueryString(params) : "";
    return httpGet<AssetSummary[]>(
      `${ASSET_ENDPOINTS.SEARCH_ASSETS}${queryString}`,
      {
        service: ASSET_SERVICE_NAME,
      },
    );
  },

  // --- Admin Topology - Racks ---
  createRack: (payload: CreateRackRequestDto): Promise<RackEntity> =>
    httpPost<RackEntity>(ASSET_ENDPOINTS.ADMIN_RACKS, payload, {
      service: ASSET_SERVICE_NAME,
    }),

  updateRack: (
    rackId: string,
    payload: UpdateRackRequestDto,
  ): Promise<RackEntity> =>
    httpPatch<RackEntity>(ASSET_ENDPOINTS.ADMIN_RACK_BY_ID(rackId), payload, {
      service: ASSET_SERVICE_NAME,
    }),

  confirmReadyRack: (rackId: string): Promise<RackEntity> =>
    httpPost<RackEntity>(
      ASSET_ENDPOINTS.CONFIRM_READY_RACK(rackId),
      undefined,
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  activateRack: (rackId: string): Promise<RackEntity> =>
    httpPost<RackEntity>(ASSET_ENDPOINTS.ACTIVATE_RACK(rackId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  drainRack: (rackId: string): Promise<RackEntity> =>
    httpPost<RackEntity>(ASSET_ENDPOINTS.DRAIN_RACK(rackId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  retireRack: (rackId: string): Promise<RackEntity> =>
    httpPost<RackEntity>(ASSET_ENDPOINTS.RETIRE_RACK(rackId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  // --- Admin Topology - Nodes ---
  normalizeNode: (payload: NormalizeNodeRequestDto): Promise<NodeEntity> =>
    httpPost<NodeEntity>(ASSET_ENDPOINTS.NORMALIZE_NODE, payload, {
      service: ASSET_SERVICE_NAME,
    }),

  getDiscoveredNodes: (): Promise<DiscoveredNodeEntity[]> =>
    httpGet<DiscoveredNodeEntity[]>(ASSET_ENDPOINTS.DISCOVERED_NODES, {
      service: ASSET_SERVICE_NAME,
    }),

  getUnassignedNodes: (): Promise<NodeEntity[]> =>
    httpGet<NodeEntity[]>(ASSET_ENDPOINTS.UNASSIGNED_NODES, {
      service: ASSET_SERVICE_NAME,
    }),

  updateNode: (
    nodeId: string,
    payload: UpdateNodeRequestDto,
  ): Promise<NodeEntity> =>
    httpPatch<NodeEntity>(ASSET_ENDPOINTS.ADMIN_NODE_BY_ID(nodeId), payload, {
      service: ASSET_SERVICE_NAME,
    }),

  assignNode: (
    nodeId: string,
    payload: AssignNodeToRackRequestDto,
  ): Promise<NodeEntity> =>
    httpPost<NodeEntity>(ASSET_ENDPOINTS.ASSIGN_RACK(nodeId), payload, {
      service: ASSET_SERVICE_NAME,
    }),

  assignDiscoveredNode: (
    agentId: string,
    payload: AssignNodeToRackRequestDto,
  ): Promise<{ node: NodeEntity; discoveredNode: DiscoveredNodeEntity }> =>
    httpPost<{ node: NodeEntity; discoveredNode: DiscoveredNodeEntity }>(
      ASSET_ENDPOINTS.ASSIGN_DISCOVERED_NODE(agentId),
      payload,
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  activateNode: (nodeId: string): Promise<NodeEntity> =>
    httpPost<NodeEntity>(ASSET_ENDPOINTS.ACTIVATE_NODE(nodeId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  drainNode: (nodeId: string): Promise<NodeEntity> =>
    httpPost<NodeEntity>(ASSET_ENDPOINTS.DRAIN_NODE(nodeId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  retireNode: (nodeId: string): Promise<NodeEntity> =>
    httpPost<NodeEntity>(ASSET_ENDPOINTS.RETIRE_NODE(nodeId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  // --- Admin Markers ---
  createMarker: (payload: CreateMarkerRequestDto): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(ASSET_ENDPOINTS.ADMIN_MARKERS, payload, {
      service: ASSET_SERVICE_NAME,
    }),

  updateMarker: (
    markerId: string,
    payload: UpdateMarkerRequestDto,
  ): Promise<MarkerEntity> =>
    httpPatch<MarkerEntity>(
      ASSET_ENDPOINTS.ADMIN_MARKER_BY_ID(markerId),
      payload,
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  generateMarker: (markerId: string): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(
      ASSET_ENDPOINTS.GENERATE_MARKER(markerId),
      undefined,
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  printMarker: (markerId: string): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(ASSET_ENDPOINTS.PRINT_MARKER(markerId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  mountMarker: (markerId: string): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(ASSET_ENDPOINTS.MOUNT_MARKER(markerId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),

  validateMarker: (markerId: string): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(
      ASSET_ENDPOINTS.VALIDATE_MARKER(markerId),
      undefined,
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  activateMarker: (markerId: string): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(
      ASSET_ENDPOINTS.ACTIVATE_MARKER(markerId),
      undefined,
      {
        service: ASSET_SERVICE_NAME,
      },
    ),

  remapMarker: (
    markerId: string,
    payload: RemapMarkerTargetRequestDto,
  ): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(ASSET_ENDPOINTS.REMAP_MARKER(markerId), payload, {
      service: ASSET_SERVICE_NAME,
    }),

  retireMarker: (markerId: string): Promise<MarkerEntity> =>
    httpPost<MarkerEntity>(ASSET_ENDPOINTS.RETIRE_MARKER(markerId), undefined, {
      service: ASSET_SERVICE_NAME,
    }),
};
