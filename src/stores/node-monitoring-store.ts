import { create } from "zustand";
import type { ErrorResponse } from "@/types/api";
import type {
  MetricMode,
  NodeMetricsData,
  NodeMetricsUpdatedPayload,
  NodeOverviewData,
  SeedWindow,
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
  nodesMetrics: Record<string, NodeMetricsState>;

  setOverviewLoading: (nodeCode: string, loading: boolean) => void;
  setOverviewData: (nodeCode: string, data: NodeOverviewData) => void;
  setOverviewError: (nodeCode: string, error: ErrorResponse | null) => void;

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

  appendMetricPoint: (
    nodeCode: string,
    mode: MetricMode,
    payload: NodeMetricsUpdatedPayload,
  ) => void;
}

const getMetricsKey = (nodeId: string, mode: MetricMode) => `${nodeId}_${mode}`;

const cloneSeedWindow = (seedWindow: SeedWindow): SeedWindow => ({
  from: seedWindow.from,
  to: seedWindow.to,
  resolutionSec: seedWindow.resolutionSec,
  timestamps: [...seedWindow.timestamps],
  nodeMetrics: {
    cpuUsagePct: [...seedWindow.nodeMetrics.cpuUsagePct],
    memoryUsagePct: [...seedWindow.nodeMetrics.memoryUsagePct],
    diskUsagePct: [...seedWindow.nodeMetrics.diskUsagePct],
    cpuTemperatureC: [...seedWindow.nodeMetrics.cpuTemperatureC],
    networkRxBytesSec: [...seedWindow.nodeMetrics.networkRxBytesSec],
    networkTxBytesSec: [...seedWindow.nodeMetrics.networkTxBytesSec],
  },
  workloadMetrics: Object.entries(seedWindow.workloadMetrics).reduce<
    Record<string, SeedWindow["workloadMetrics"][string]>
  >((acc, [wlId, series]) => {
    acc[wlId] = {
      cpuUsagePct: [...series.cpuUsagePct],
      memoryUsagePct: [...series.memoryUsagePct],
    };
    return acc;
  }, {}),
});

const appendToWindow = (
  window: SeedWindow,
  payload: NodeMetricsUpdatedPayload,
  maxPoints: number,
): SeedWindow => {
  const nextTimestamps = [...window.timestamps, payload.ts];

  const nextNodeMetrics = {
    cpuUsagePct: [...window.nodeMetrics.cpuUsagePct, payload.node.cpuUsagePct],
    memoryUsagePct: [
      ...window.nodeMetrics.memoryUsagePct,
      payload.node.memoryUsagePct,
    ],
    diskUsagePct: [...window.nodeMetrics.diskUsagePct, payload.node.diskUsagePct],
    cpuTemperatureC: [
      ...window.nodeMetrics.cpuTemperatureC,
      payload.node.cpuTemperatureC,
    ],
    networkRxBytesSec: [
      ...window.nodeMetrics.networkRxBytesSec,
      payload.node.networkRxBytesSec,
    ],
    networkTxBytesSec: [
      ...window.nodeMetrics.networkTxBytesSec,
      payload.node.networkTxBytesSec,
    ],
  };

  const nextWorkloadMetrics: SeedWindow["workloadMetrics"] = {};
  Object.entries(window.workloadMetrics).forEach(([wlId, series]) => {
    const wlUpdate = payload.workloads[wlId];
    nextWorkloadMetrics[wlId] = {
      cpuUsagePct: [...series.cpuUsagePct, wlUpdate?.cpuUsagePct ?? null],
      memoryUsagePct: [...series.memoryUsagePct, wlUpdate?.memoryUsagePct ?? null],
    };
  });

  if (Number.isNaN(new Date(payload.ts).getTime())) {
    return window;
  }

  const overflowCount = nextTimestamps.length - maxPoints;
  if (overflowCount <= 0) {
    return {
      ...window,
      from: nextTimestamps[0] || window.from,
      to: payload.ts,
      timestamps: nextTimestamps,
      nodeMetrics: nextNodeMetrics,
      workloadMetrics: nextWorkloadMetrics,
    };
  }

  const slicedTimestamps = nextTimestamps.slice(overflowCount);
  const sliceSeries = <T,>(series: T[]) => series.slice(overflowCount);

  return {
    ...window,
    from: slicedTimestamps[0] || window.from,
    to: payload.ts,
    timestamps: slicedTimestamps,
    nodeMetrics: {
      cpuUsagePct: sliceSeries(nextNodeMetrics.cpuUsagePct),
      memoryUsagePct: sliceSeries(nextNodeMetrics.memoryUsagePct),
      diskUsagePct: sliceSeries(nextNodeMetrics.diskUsagePct),
      cpuTemperatureC: sliceSeries(nextNodeMetrics.cpuTemperatureC),
      networkRxBytesSec: sliceSeries(nextNodeMetrics.networkRxBytesSec),
      networkTxBytesSec: sliceSeries(nextNodeMetrics.networkTxBytesSec),
    },
    workloadMetrics: Object.entries(nextWorkloadMetrics).reduce<
      SeedWindow["workloadMetrics"]
    >((acc, [wlId, series]) => {
      acc[wlId] = {
        cpuUsagePct: sliceSeries(series.cpuUsagePct),
        memoryUsagePct: sliceSeries(series.memoryUsagePct),
      };
      return acc;
    }, {}),
  };
};

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
          metrics: {
            ...data,
            chartWindow: cloneSeedWindow(data.seedWindow),
          },
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
        return state;
      }

      const { metrics } = nodeMetricState;
      const currentWindow = metrics.chartWindow
        ? metrics.chartWindow
        : cloneSeedWindow(metrics.seedWindow);
      const nextWindow = appendToWindow(
        currentWindow,
        payload,
        currentWindow.timestamps.length,
      );

      return {
        nodesMetrics: {
          ...state.nodesMetrics,
          [key]: {
            ...nodeMetricState,
            metrics: {
              ...metrics,
              chartWindow: nextWindow,
            },
          },
        },
      };
    });
  },
}));
