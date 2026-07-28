import { create } from "zustand";
import type { ErrorResponse } from "@/types/api";
import type {
  MetricMode,
  NodeMetricsData,
  NodeMetricsUpdatedPayload,
  NodeOverviewData,
} from "@/types/monitoring";

interface NodeOverviewState {
  overview: NodeOverviewData | null;
  loading: boolean;
  error: ErrorResponse | null;
}

interface NodeMetricsState {
  metrics: NodeMetricsData | null;
  loading: boolean;
  error: ErrorResponse | null;
}

interface MonitoringState {
  nodesOverview: Record<string, NodeOverviewState>;
  // Key dạng `${nodeId}_${mode}` (VD: "node-1_standard" hoặc "node-1_live")
  nodesMetrics: Record<string, NodeMetricsState>;

  // Overview Actions
  setOverviewLoading: (nodeCode: string, loading: boolean) => void;
  setOverviewData: (nodeCode: string, data: NodeOverviewData) => void;
  setOverviewError: (nodeCode: string, error: ErrorResponse | null) => void;

  // Metrics Actions
  setMetricsLoading: (
    nodeCode: string,
    mode: MetricMode,
    loading: boolean,
  ) => void;
  setMetricsData: (
    nodeCode: string,
    mode: MetricMode,
    data: NodeMetricsData,
  ) => void;
  setMetricsError: (
    nodeCode: string,
    mode: MetricMode,
    error: ErrorResponse | null,
  ) => void;

  // Socket Actions
  appendMetricPoint: (
    nodeCode: string,
    mode: MetricMode,
    payload: NodeMetricsUpdatedPayload,
  ) => void;
}

const getMetricsKey = (nodeId: string, mode: MetricMode) => `${nodeId}_${mode}`;

export const useMonitoringStore = create<MonitoringState>((set) => ({
  nodesOverview: {},
  nodesMetrics: {},

  setOverviewLoading: (nodeCode, loading) =>
    set((state) => ({
      nodesOverview: {
        ...state.nodesOverview,
        [nodeCode]: {
          ...state.nodesOverview[nodeCode],
          loading,
        },
      },
    })),

  setOverviewData: (nodeCode, data) =>
    set((state) => ({
      nodesOverview: {
        ...state.nodesOverview,
        [nodeCode]: {
          overview: data,
          loading: false,
          error: null,
        },
      },
    })),

  setOverviewError: (nodeCode, error) =>
    set((state) => ({
      nodesOverview: {
        ...state.nodesOverview,
        [nodeCode]: {
          ...state.nodesOverview[nodeCode],
          error,
          loading: false,
        },
      },
    })),

  setMetricsLoading: (nodeCode, mode, loading) => {
    const key = getMetricsKey(nodeCode, mode);
    set((state) => ({
      nodesMetrics: {
        ...state.nodesMetrics,
        [key]: {
          ...state.nodesMetrics[key],
          loading,
        },
      },
    }));
  },

  setMetricsData: (nodeCode, mode, data) => {
    const key = getMetricsKey(nodeCode, mode);
    set((state) => ({
      nodesMetrics: {
        ...state.nodesMetrics,
        [key]: {
          metrics: data,
          loading: false,
          error: null,
        },
      },
    }));
  },

  setMetricsError: (nodeCode, mode, error) => {
    const key = getMetricsKey(nodeCode, mode);
    set((state) => ({
      nodesMetrics: {
        ...state.nodesMetrics,
        [key]: {
          ...state.nodesMetrics[key],
          error,
          loading: false,
        },
      },
    }));
  },

  appendMetricPoint: (nodeCode, mode, payload) => {
    const key = getMetricsKey(nodeCode, mode);
    set((state) => {
      const nodeMetricState = state.nodesMetrics[key];
      if (!nodeMetricState?.metrics) {
        return state; // No metrics data to append to
      }

      const { metrics } = nodeMetricState;
      const { retentionSec } = metrics.metricsConfig;
      const seedWindow = metrics.seedWindow;

      // 1. Immutable Append new timestamp
      let timestamps = [...seedWindow.timestamps, payload.ts];

      const nodeMetrics = { ...seedWindow.nodeMetrics };
      (Object.keys(nodeMetrics) as Array<keyof typeof nodeMetrics>).forEach(
        (key) => {
          const val = payload.node[key] ?? null;
          nodeMetrics[key] = [...nodeMetrics[key], val];
        },
      );

      const workloadMetrics = { ...seedWindow.workloadMetrics };
      Object.keys(workloadMetrics).forEach((wlId) => {
        const wlUpdate = payload.workloads[wlId];
        const series = workloadMetrics[wlId];
        workloadMetrics[wlId] = {
          cpuUsagePct: [...series.cpuUsagePct, wlUpdate?.cpuUsagePct ?? null],
          memoryUsagePct: [
            ...series.memoryUsagePct,
            wlUpdate?.memoryUsagePct ?? null,
          ],
        };
      });

      // 2. Slide the window to satisfy retention rules
      const newLatestTime = new Date(payload.ts).getTime();
      if (isNaN(newLatestTime)) {
        return state; // Escape nếu payload.ts không hợp lệ
      }

      const retentionMs = retentionSec * 1000;
      let cutIndex = 0;

      // Tìm vị trí point đầu tiên thỏa mãn khung retentionSec
      while (
        cutIndex < timestamps.length - 1 &&
        newLatestTime - new Date(timestamps[cutIndex]).getTime() > retentionMs
      ) {
        cutIndex++;
      }

      // 3. Slice mảng nếu có point quá hạn
      if (cutIndex > 0) {
        timestamps = timestamps.slice(cutIndex);
        (Object.keys(nodeMetrics) as Array<keyof typeof nodeMetrics>).forEach(
          (key) => {
            nodeMetrics[key] = nodeMetrics[key].slice(cutIndex);
          },
        );

        Object.keys(workloadMetrics).forEach((wlId) => {
          workloadMetrics[wlId] = {
            cpuUsagePct: workloadMetrics[wlId].cpuUsagePct.slice(cutIndex),
            memoryUsagePct:
              workloadMetrics[wlId].memoryUsagePct.slice(cutIndex),
          };
        });
      }

      return {
        nodesMetrics: {
          ...state.nodesMetrics,
          [key]: {
            ...nodeMetricState,
            metrics: {
              ...metrics,
              seedWindow: {
                ...seedWindow,
                timestamps,
                nodeMetrics,
                workloadMetrics,
                to: payload.ts,
                from: timestamps[0] || seedWindow.from,
              },
            },
          },
        },
      };
    });
  },
}));
