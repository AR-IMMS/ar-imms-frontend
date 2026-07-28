export type MetricMode = "standard" | "live";

export type NodeStatus = "healthy" | "alerting" | "unknown";
export type NodeSeverity =
  | "healthy"
  | "stale"
  | "warning"
  | "high"
  | "critical";

// #region Node Overview Data
export interface NodeOverviewDataNode {
  nodeId: string;
  status: NodeStatus;
  severity: NodeSeverity;
  lastSeenAt: string;
  freshnessSec: number;
  fingerprintSeenAt: string | null;
  batteryModel: string | null;
  cpuArchitecture: string | null;
  cpuModel: string | null;
  gpuModelPrimary: string | null;
  hardwareSerial: string | null;
  logicalCpuCount: number | null;
  macAddress: string | null;
  motherboardModel: string | null;
  osProduct: string | null;
  primaryIpv4: string | null;
  ssdModelPrimary: string | null;
}

interface MetricValueState {
  value: string | null;
  unit: string | null;
}

interface WorstMetric {
  metricKey: string | null;
  metricValueNumeric: number | null;
  metricValueText: string | null;
}

interface AlertCounters {
  criticalMetricCount: number;
  warningMetricCount: number;
  staleMetricCount: number;
}

export interface SummaryMetrics {
  primaryNicStatus: MetricValueState;
  worstMetric: WorstMetric;
  alertCounters: AlertCounters;
}

export interface WorkloadSummary {
  total: number;
  unhealthy: number;
  nonRunning: number;
  returned: number;
  selectionMode: "abnormal_first_then_top_cpu";
}

export interface WorkloadItem {
  workloadId: string;
  workloadType: "container";
  name: string;
  serviceName: string;
  status: string;
  healthStatus: string;
  restartCount: number;
  worstMetricKey: string | null;
  isAbnormal: boolean;
}

export interface RealtimeConfig {
  transport: "socket.io";
  channel: string;
}

export interface NodeOverviewData {
  node: NodeOverviewDataNode;
  summaryMetrics: SummaryMetrics;
  workloadSummary: WorkloadSummary;
  workloads: WorkloadItem[];
  realtime: RealtimeConfig;
}
// #endregion Node Overview Data

// #region Node Metrics Data
export interface NodeMetricsQueryParams {
  from?: string;
  to?: string;
  interval?: string;
  [key: string]: unknown;
}

export interface MetricsConfig {
  transport: "socket.io";
  channel: string;
  bucketSec: number;
  retentionSec: number;
  nodeMetricKeys: string[];
  workloadMetricKeys: string[];
}

export interface MetricsUnits {
  cpuUsagePct: string;
  memoryUsagePct: string;
  diskUsagePct: string;
  cpuTemperatureC: string;
  networkRxBytesSec: string;
  networkTxBytesSec: string;
  workloadCpuUsagePct: string;
  workloadMemoryUsagePct: string;
}

export interface TrackedWorkload {
  workloadId: string;
  workloadType: "container";
  name: string;
}

export interface NodeMetricsSeries {
  cpuUsagePct: (number | null)[];
  memoryUsagePct: (number | null)[];
  diskUsagePct: (number | null)[];
  cpuTemperatureC: (number | null)[];
  networkRxBytesSec: (number | null)[];
  networkTxBytesSec: (number | null)[];
}

export interface WorkloadMetricsSeries {
  cpuUsagePct: (number | null)[];
  memoryUsagePct: (number | null)[];
}

export interface SeedWindow {
  from: string | null;
  to: string | null;
  resolutionSec: number;
  timestamps: string[];
  nodeMetrics: NodeMetricsSeries;
  workloadMetrics: Record<string, WorkloadMetricsSeries>;
}

export interface NodeMetricsData {
  nodeId: string;
  metricsConfig: MetricsConfig;
  meta: {
    units: MetricsUnits;
  };
  workloads: TrackedWorkload[];
  seedWindow: SeedWindow;
}
// #endregion Node Metrics Data

// #region Socket IO Event payloads
export interface NodeOverviewChangedPayload {
  event: "monitoring.node.overview.changed";
  nodeId: string;
  channel: string;
  changedAt: string;
}

interface RealtimeNodeMetrics {
  cpuUsagePct: number | null;
  memoryUsagePct: number | null;
  diskUsagePct: number | null;
  cpuTemperatureC: number | null;
  networkRxBytesSec: number | null;
  networkTxBytesSec: number | null;
}

interface RealtimeWorkloadMetrics {
  cpuUsagePct: number | null;
  memoryUsagePct: number | null;
}

export interface NodeMetricsUpdatedPayload {
  event: "monitoring.node.metrics.updated";
  nodeId: string;
  channel: string;
  ts: string;
  bucketSec: number;
  node: RealtimeNodeMetrics;
  workloads: Record<string, RealtimeWorkloadMetrics>;
}

export interface RealtimeWorkloadItem {
  workloadId: string;
  workloadType: "container";
  name: string;
  status: string;
  latestCpuUsagePct: number | null;
  latestMemoryUsagePct: number | null;
}

export interface NodeWorkloadsChangedPayload {
  event: "monitoring.node.metrics.workloads.changed";
  nodeId: string;
  channel: string;
  ts: string;
  workloadSummary: {
    total: number;
    returned: number;
    selectionMode: "top_cpu_then_memory";
  };
  workloads: RealtimeWorkloadItem[];
}
// #endregion Socket IO Event payloads

// #region Chart Data
export interface ChartDataPoint extends RealtimeNodeMetrics {
  timestamp: string;
  formattedTime: string;
  workloads: Record<string, RealtimeWorkloadMetrics>;
}
// #endregion Chart Data