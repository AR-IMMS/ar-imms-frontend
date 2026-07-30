"use client";

import { useCallback, useMemo, useState } from "react";
import NodeHardwareGrid from "./components/node-level/node-hardware-grid";
import WorkloadContainerGrid from "./components/node-level/workload-container-grid";
import { useNodeOverview } from "@/hooks/monitoring/use-node-overview";
import { useNodeMetrics } from "@/hooks/monitoring/use-node-metrics";
import { ShieldAlert, AlertTriangle, RefreshCcw } from "lucide-react";
import { transformToChartData } from "./lib/utils/data-store-helpers";
import { WorkspaceBreadcrumbs } from "@/components/common/workspace-breadcrumbs";
import { NodeEntity } from "@/types/assets";
import type { NodeMetricsQueryParams } from "@/types/monitoring";

interface MonitoringTelemetryViewportProps {
  nodeItem: NodeEntity;
}

type RangeDuration = "1m" | "5m" | "15m" | "30m" | "1h" | "6h" | "24h";

const floorToBucket = (date: Date, bucketMs: number) =>
  new Date(Math.floor(date.getTime() / bucketMs) * bucketMs);

const calculateQueryParams = (
  duration: RangeDuration,
): NodeMetricsQueryParams => {
  const nowMs = Date.now();
  let diffSec = 300;
  let intervalSec = 60;

  switch (duration) {
    case "1m":
      diffSec = 60;
      intervalSec = 5;
      break;
    case "5m":
      diffSec = 300;
      intervalSec = 5;
      break;
    case "15m":
      diffSec = 900;
      intervalSec = 60;
      break;
    case "30m":
      diffSec = 1800;
      intervalSec = 60;
      break;
    case "1h":
      diffSec = 3600;
      intervalSec = 60;
      break;
    case "6h":
      diffSec = 21600;
      intervalSec = 60;
      break;
    case "24h":
      diffSec = 86400;
      intervalSec = 60;
      break;
  }

  const resolutionMs = intervalSec * 1000;
  const to = floorToBucket(new Date(nowMs), resolutionMs).toISOString();
  const from = floorToBucket(
    new Date(nowMs - diffSec * 1000),
    resolutionMs,
  ).toISOString();

  return {
    from,
    to,
    interval: intervalSec === 5 ? "5" : "60",
  };
};

export default function MonitoringTelemetryViewport({
  nodeItem,
}: MonitoringTelemetryViewportProps) {
  const [rangeDuration, setRangeDuration] = useState<RangeDuration>("5m");
  const isLiveMode = rangeDuration === "1m" || rangeDuration === "5m";

  const [queryParams, setQueryParams] = useState<NodeMetricsQueryParams>(() =>
    calculateQueryParams(rangeDuration),
  );

  const handleRangeChange = useCallback((duration: RangeDuration) => {
    setRangeDuration(duration);
    setQueryParams(calculateQueryParams(duration));
  }, []);

  const { overview, loading: loadingOverview } = useNodeOverview(
    nodeItem.nodeCode,
  );
  const worstMetric = overview?.summaryMetrics.primaryIssue;

  const { metrics, loading: loadingMetrics } = useNodeMetrics(
    nodeItem.nodeCode,
    {
      params: queryParams,
      isLive: isLiveMode,
    },
  );

  const chartData = useMemo(() => {
    return transformToChartData(metrics ?? null);
  }, [metrics]);

  const alertCounters = useMemo(() => {
    return (
      overview?.summaryMetrics.alertCounters || {
        critical: 0,
        warning: 0,
        stale: 0,
      }
    );
  }, [overview?.summaryMetrics.alertCounters]);

  const isViewportLoading = loadingOverview || loadingMetrics;

  return (
    <div
      className={`flex-1 flex flex-col p-4 space-y-4 overflow-hidden min-w-0 transition-opacity duration-200 ${
        isViewportLoading ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <WorkspaceBreadcrumbs />

        {/* Range Duration Selector */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex bg-muted p-0.5 rounded border border-border/80 font-mono text-[10px]">
            {(["1m", "5m", "15m", "30m", "1h", "6h", "24h"] as const).map(
              (r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`px-2 py-1 rounded-sm uppercase font-semibold cursor-pointer ${
                    rangeDuration === r
                      ? "bg-cyan/15 text-cyan font-bold border border-cyan/20"
                      : "text-foreground/55 hover:text-foreground/70 border border-transparent"
                  }`}
                >
                  {r}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-2">
        <div className="panel rounded py-1.5 px-3 bg-slate-950 border border-border/80 flex items-center flex-1 gap-3 shrink-0 overflow-hidden font-mono text-[10px]">
          <div
            className={`size-2 rounded-full bg-critical animate-ping shrink-0 ${worstMetric ? "block" : "hidden"}`}
          />
          <div className="flex-1 truncate">
            {worstMetric?.metricKey ? (
              <span className="text-critical uppercase tracking-wider font-semibold animate-pulse">
                DIAGNOSTIC EXCURSION FAULT: {worstMetric.metricKey} ={"  "}
                {worstMetric.value}
              </span>
            ) : (
              <span className="text-emerald-400 uppercase tracking-wider">
                SYSTEM STATE OPTIMIZED - ZERO ACTIVE CRITICAL TELEMETRY
                EXCURSIONS DETECTED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1 bg-critical/15 text-critical border border-critical/30 px-2 py-1 rounded shadow-[0_0_6px_rgba(255,77,109,0.1)]">
            <ShieldAlert className="size-3 animate-pulse" />
            <span>CRIT: {alertCounters.critical}</span>
          </div>
          <div className="flex items-center gap-1 bg-amber/15 text-amber border border-amber/30 px-2 py-1 rounded shadow-[0_0_6px_rgba(255,200,87,0.1)]">
            <AlertTriangle className="size-3" />
            <span>WARN: {alertCounters.warning}</span>
          </div>
          <div className="flex items-center gap-1 bg-purple/15 text-purple border border-purple/30 px-2 py-1 rounded shadow-[0_0_6px_rgba(139,92,246,0.1)]">
            <RefreshCcw className="size-3" />
            <span>STALE: {alertCounters.stale}</span>
          </div>
        </div>
      </div>

      <NodeHardwareGrid
        metrics={chartData}
        primaryNicStatus={
          overview?.summaryMetrics.primaryNicStatus
            ? { value: overview.summaryMetrics.primaryNicStatus, unit: "state" }
            : null
        }
      />

      <WorkloadContainerGrid overview={overview} metrics={chartData} />
    </div>
  );
}
