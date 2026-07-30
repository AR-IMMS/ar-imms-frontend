import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { monitoringService } from "@/services/monitoring/monitoring-service";
import {
  useRackMonitoringStore,
  DEFAULT_RACK_OVERVIEW_STATE,
} from "@/stores/rack-monitoring-store";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { ApiError } from "@/types/api";

export const useRackOverview = (rackId: string) => {
  const overviewState = useRackMonitoringStore(
    (s) => s.racksOverview[rackId] || DEFAULT_RACK_OVERVIEW_STATE,
  );
  const setOverviewError = useRackMonitoringStore((s) => s.setOverviewError);
  const setOverviewData = useRackMonitoringStore((s) => s.setOverviewData);
  const setOverviewLoading = useRackMonitoringStore((s) => s.setOverviewLoading);

  const queryKey = queryKeys.monitoring.racks.overview(rackId);

  const { isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await monitoringService.getRackOverview(rackId);
      setOverviewData(rackId, data);
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000, // Refetch every 15 seconds as requested
    enabled: !!rackId,
  });

  // Sync loading state to store
  useEffect(() => {
    if (rackId) {
      setOverviewLoading(rackId, isLoading || isFetching);
    }
  }, [isLoading, isFetching, rackId, setOverviewLoading]);

  // Sync error if fetch fails
  useEffect(() => {
    if (error && rackId) {
      const apiErr = error as unknown as ApiError;
      setOverviewError(rackId, {
        code: apiErr.code || "FETCH_ERROR",
        message: apiErr.message || "Failed to fetch rack overview",
      });
    }
  }, [error, rackId, setOverviewError]);

  return {
    overview: overviewState.overview,
    loading: overviewState.loading,
    error: overviewState.error,
    refetch,
  };
};
