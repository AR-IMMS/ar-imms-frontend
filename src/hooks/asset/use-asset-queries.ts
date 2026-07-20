import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { assetService } from "@/services/asset/asset-service";
import { queryKeys } from "@/lib/react-query/query-keys";

const DEFAULT_STALE_TIME = 30_000; // 30 seconds

export function useTopologyTreeQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.asset.topologyTree(),
    queryFn: () => assetService.getTopologyTree(),
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useRackTopologyQuery(rackId: string, enabled = true) {
  const normalizedRackId = rackId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.asset.rackTopology(normalizedRackId),
    queryFn: () => assetService.getRackTopology(normalizedRackId),
    enabled: enabled && normalizedRackId.length > 0,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useAssetSummaryQuery(code: string, enabled = true) {
  const normalizedCode = code?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.asset.assetByCode(normalizedCode),
    queryFn: () => assetService.getAssetByCode(normalizedCode),
    enabled: enabled && normalizedCode.length > 0,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useNodeContextQuery(nodeId: string, enabled = true) {
  const normalizedNodeId = nodeId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.asset.nodeContext(normalizedNodeId),
    queryFn: () => assetService.getNodeContext(normalizedNodeId),
    enabled: enabled && normalizedNodeId.length > 0,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useAssetSearchQuery(
  params?: { q?: string; type?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.asset.search(params),
    queryFn: () => assetService.searchAssets(params),
    enabled,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function usePendingAssignmentNodesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.asset.pendingAssignmentNodes(),
    queryFn: () => assetService.getPendingAssignmentNodes(),
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  });
}

// export function useMarkerResolutionQuery(markerCode: string, enabled = true) {
//   const normalizedMarkerCode = markerCode?.trim() ?? "";

//   return useQuery({
//     queryKey: queryKeys.asset.resolveMarker(normalizedMarkerCode),
//     queryFn: () => assetService.resolveMarker(normalizedMarkerCode),
//     enabled: enabled && normalizedMarkerCode.length > 0,
//     staleTime: DEFAULT_STALE_TIME,
//   });
// }
