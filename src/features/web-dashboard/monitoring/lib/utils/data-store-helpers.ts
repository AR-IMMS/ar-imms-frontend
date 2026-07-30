// Performance-Optimized Selectors

import { ChartDataPoint, NodeMetricsData } from "@/types/monitoring";
import { parseToLocalDate } from "@/lib/utils/formatTime";

/**
 * Helper transform dữ liệu pure
 * Gọi hàm này bên trong `useMemo` tại React Component
 */
export const transformToChartData = (
  metricsData: NodeMetricsData | null,
): ChartDataPoint[] => {
  const window = metricsData?.chartWindow ?? metricsData?.seedWindow;
  if (!window) return [];
  const { timestamps, nodeMetrics, workloadMetrics } = window;

  return timestamps.map((ts, index) => {
    const localDate = parseToLocalDate(ts);
    const formattedTime = localDate
      ? `${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}`
      : "";
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
