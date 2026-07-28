import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { monitoringService } from "@/services/monitoring/monitoring-service";
import { useMonitoringStore } from "@/stores/monitoring-store";
import { queryKeys } from "@/lib/react-query/query-keys";
import { socketManager } from "@/lib/socket/socket-manager";
import type { ApiError } from "@/types/api";
import type { NodeOverviewChangedPayload } from "@/types/monitoring";

export const useNodeOverview = (nodeCode: string) => {
  const { setOverviewError, setOverviewData } = useMonitoringStore();
  const overviewState = useMonitoringStore((s) => s.nodesOverview[nodeCode]);

  const queryKey = queryKeys.monitoring.nodes.overview(nodeCode);

  const { isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await monitoringService.getNodeOverview(nodeCode);
      setOverviewData(nodeCode, data);
      return data;
    },
    staleTime: 30_000, // 30 seconds
    enabled: !!nodeCode,
  });

  // Sync error nếu fetch thất bại
  useEffect(() => {
    if (error && nodeCode) {
      const apiErr = error as unknown as ApiError;
      setOverviewError(nodeCode, {
        code: apiErr.code || "FETCH_ERROR",
        message: apiErr.message || "Failed to fetch node overview",
      });
    }
  }, [error, nodeCode, setOverviewError]);

  // Listen Socket change event (Chỉ re-subscribe khi nodeCode đổi)
  useEffect(() => {
    if (!nodeCode) return;

    const channel = `monitoring.node.${nodeCode}.overview.changed`;

    const unsubscribe = socketManager.subscribe<NodeOverviewChangedPayload>(
      channel,
      (payload) => {
        console.log(
          `[useNodeOverview] Node overview change notification received for ${nodeCode}, refetching...`,
          payload,
        );
        refetch();
      },
    );

    return () => {
      unsubscribe();
    };
  }, [nodeCode, refetch]);

  return {
    overview: overviewState?.overview ?? null,
    loading: isLoading || overviewState?.loading || false,
    error: overviewState?.error ?? null,
    refetch,
  };
};
