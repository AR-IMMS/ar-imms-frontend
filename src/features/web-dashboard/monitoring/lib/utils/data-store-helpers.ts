// Performance-Optimized Selectors

import {
  ChartDataPoint,
  NodeMetricsData,
  NodeOverviewData,
  NodeStatus,
  WorkloadItem,
} from "@/types/monitoring";

/**
 * Helper transform dữ liệu pure
 * Gọi hàm này bên trong `useMemo` tại React Component
 */
export const transformToChartData = (
  metricsData: NodeMetricsData | null,
): ChartDataPoint[] => {
  if (!metricsData?.seedWindow) return [];
  const { timestamps, nodeMetrics, workloadMetrics } = metricsData.seedWindow;

  return timestamps.map((ts, index) => {
    const formattedTime = new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const wlData: Record<
      string,
      { cpuUsagePct: number | null; memoryUsagePct: number | null }
    > = {};

    Object.entries(workloadMetrics).forEach(([wlId, series]) => {
      wlData[wlId] = {
        cpuUsagePct: series.cpuUsagePct[index] ?? null,
        memoryUsagePct: series.memoryUsagePct[index] ?? null,
      };
    });

    return {
      timestamp: ts,
      formattedTime,
      cpuUsagePct: nodeMetrics.cpuUsagePct[index] ?? null,
      memoryUsagePct: nodeMetrics.memoryUsagePct[index] ?? null,
      diskUsagePct: nodeMetrics.diskUsagePct[index] ?? null,
      cpuTemperatureC: nodeMetrics.cpuTemperatureC[index] ?? null,
      networkRxBytesSec: nodeMetrics.networkRxBytesSec[index] ?? null,
      networkTxBytesSec: nodeMetrics.networkTxBytesSec[index] ?? null,
      workloads: wlData,
    };
  });
};

// Helper function to derive NodeStatus from NodeOverviewData
export const selectDerivedNodeStatus = (
  overview: NodeOverviewData | null,
): NodeStatus => {
  if (!overview) return "unknown";
  const { alertCounters } = overview.summaryMetrics;
  if (
    alertCounters.stale > 0 &&
    alertCounters.critical === 0 &&
    alertCounters.warning === 0
  ) {
    return "unknown";
  }
  if (alertCounters.critical > 0 || alertCounters.warning > 0) {
    return "alerting";
  }
  return "healthy";
};

export const selectAbnormalWorkloads = (
  overview: NodeOverviewData | null,
): WorkloadItem[] => {
  if (!overview) return [];
  return overview.workloads.filter((w) => {
    const health = w.healthStatus.trim().toLowerCase();
    const status = w.status.trim().toLowerCase();
    return health === "unhealthy" || status !== "running" || w.restartCount > 0;
  });
};
