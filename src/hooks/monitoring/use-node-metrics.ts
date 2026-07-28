import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { socketManager } from "@/lib/socket/socket-manager";
import { monitoringService } from "@/services/monitoring/monitoring-service";
import { useMonitoringStore } from "@/stores/monitoring-store";
import type { ApiError } from "@/types/api";
import type {
  MetricMode,
  NodeMetricsQueryParams,
  NodeMetricsUpdatedPayload,
  NodeWorkloadsChangedPayload,
} from "@/types/monitoring";

interface UseNodeMetricsOptions {
  params?: NodeMetricsQueryParams;
  isLive?: boolean; // Default false (Standard)
}

export const useNodeMetrics = (
  nodeCode: string,
  options?: UseNodeMetricsOptions,
) => {
  const isLive = options?.isLive ?? false;
  const mode: MetricMode = isLive ? "live" : "standard";
  const params = options?.params;

  // Key để query trong store
  const metricsKey = `${nodeCode}_${mode}`;

  const metricsState = useMonitoringStore((s) => s.nodesMetrics[metricsKey]);
  const { setMetricsData, setMetricsError, appendMetricPoint } =
    useMonitoringStore();

  // Dùng Ref giữ hàm appendMetricPoint để KHÔNG TRUYỀN vào Dependency Array của Socket Effect
  // Tránh việc re-subscribe socket liên tục khi store re-render
  const appendMetricPointRef = useRef(appendMetricPoint);
  useEffect(() => {
    appendMetricPointRef.current = appendMetricPoint;
  }, [appendMetricPoint]);

  const queryKey = queryKeys.monitoring.nodes.metrics(nodeCode, {
    ...params,
    isLive,
  });

  const { isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Gọi API tương ứng dựa theo cờ isLive
      const data = isLive
        ? await monitoringService.getNodeMetricsLive(nodeCode, params)
        : await monitoringService.getNodeMetrics(nodeCode, params);

      // Save seed data vào Zustand Store
      setMetricsData(nodeCode, mode, data);
      return data;
    },
    staleTime: isLive ? 5_000 : 60_000, // 10s cho live, 60s cho standard
    placeholderData: keepPreviousData,
    enabled: !!nodeCode,
  });

  // Sync Error
  useEffect(() => {
    if (error && nodeCode) {
      const apiErr = error as unknown as ApiError;
      setMetricsError(nodeCode, mode, {
        code: apiErr.code || "FETCH_ERROR",
        message: apiErr.message || "Failed to fetch node metrics",
      });
    }
  }, [error, nodeCode, mode, setMetricsError]);

  // Manage real-time data stream subscriptions
  useEffect(() => {
    if (!nodeCode || !metricsState?.metrics) return;

    // Subscribe channel cập nhật chỉ số metric
    const metricsChannel =
      metricsState.metrics.metricsConfig?.channel ||
      `monitoring.node.${nodeCode}.metrics.updated`;
    const unsubscribeMetrics =
      socketManager.subscribe<NodeMetricsUpdatedPayload>(
        metricsChannel,
        (payload) => {
          console.log(
            `[useNodeMetrics] Real-time metrics update received for node ${nodeCode}`,
            payload,
          );
          appendMetricPointRef.current(nodeCode, mode, payload);
        },
      );

    // Subscribe channel cập nhật thay đổi danh sách workload (Top 5 changed)
    const workloadsChannel = `monitoring.node.${nodeCode}.metrics.workloads.changed`;
    const unsubscribeWorkloads =
      socketManager.subscribe<NodeWorkloadsChangedPayload>(
        workloadsChannel,
        (payload) => {
          console.log(
            `[useNodeMetrics][${mode}] Workload membership layout changed for node ${nodeCode}, refetching seed window...`,
            payload,
          );
          refetch();
        },
      );

    return () => {
      unsubscribeMetrics();
      unsubscribeWorkloads();
    };
  }, [nodeCode, mode, metricsState?.metrics, refetch]);

  return {
    metrics: metricsState?.metrics ?? null,
    loading: isLoading || metricsState?.loading || false,
    error: metricsState?.error ?? null,
    refetch,
  };
};
