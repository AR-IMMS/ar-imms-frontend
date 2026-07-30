import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { socketManager } from "@/lib/socket/socket-manager";
import { monitoringService } from "@/services/monitoring/monitoring-service";
import { useMonitoringStore } from "@/stores/node-monitoring-store";
import type { ApiError } from "@/types/api";
import type {
  MetricMode,
  NodeMetricsQueryParams,
  NodeMetricsUpdatedPayload,
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
  const setMetricsLoading = useMonitoringStore((s) => s.setMetricsLoading);
  const setMetricsData = useMonitoringStore((s) => s.setMetricsData);
  const setMetricsError = useMonitoringStore((s) => s.setMetricsError);
  const appendMetricPoint = useMonitoringStore((s) => s.appendMetricPoint);
  const metricsChannel =
    metricsState?.metrics?.metricsConfig?.channel ??
    `monitoring.node.${nodeCode}.metrics.updated`;
  const metricsBucketSec = metricsState?.metrics?.metricsConfig?.bucketSec;
  const hasMetricsSeed = Boolean(metricsState?.metrics);

  // Dùng Ref giữ hàm appendMetricPoint để KHÔNG TRUYỀN vào Dependency Array của Socket Effect
  // Tránh việc re-subscribe socket liên tục khi store re-render
  const appendMetricPointRef = useRef(appendMetricPoint);
  const requestSignature = `${nodeCode}|${mode}|${params?.from ?? ""}|${params?.to ?? ""}|${params?.interval ?? ""}|${isLive ? "1" : "0"}`;
  const activeRequestSignatureRef = useRef(requestSignature);
  useEffect(() => {
    appendMetricPointRef.current = appendMetricPoint;
  }, [appendMetricPoint]);
  useEffect(() => {
    activeRequestSignatureRef.current = requestSignature;
  }, [requestSignature]);

  const queryKey = queryKeys.monitoring.nodes.metrics(nodeCode, {
    ...params,
    isLive,
  });

  const { isPending, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Gọi API tương ứng dựa theo cờ isLive
      const data = isLive
        ? await monitoringService.getNodeMetricsLive(nodeCode, params)
        : await monitoringService.getNodeMetrics(nodeCode, params);

      if (activeRequestSignatureRef.current !== requestSignature) {
        return data;
      }

      // Save seed data vào Zustand Store
      setMetricsData(nodeCode, mode, data);
      return data;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    enabled: !!nodeCode,
  });

  useEffect(() => {
    if (!nodeCode) return;
    setMetricsLoading(nodeCode, mode, isPending || isFetching);
  }, [nodeCode, mode, isPending, isFetching, setMetricsLoading]);

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
    if (!nodeCode || !hasMetricsSeed || !metricsBucketSec) return;

    // Subscribe channel cập nhật chỉ số metric
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

    return () => {
      unsubscribeMetrics();
    };
  }, [nodeCode, mode, hasMetricsSeed, metricsChannel, metricsBucketSec]);

  return {
    metrics: metricsState?.metrics ?? null,
    loading: metricsState?.loading || isPending || isFetching || false,
    error: metricsState?.error ?? null,
    refetch,
  };
};
