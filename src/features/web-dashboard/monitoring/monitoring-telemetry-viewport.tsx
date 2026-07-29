"use client";

import { useCallback, useMemo, useState } from "react";
import NodeHardwareGrid from "./components/node-hardware-grid";
import WorkloadContainerGrid from "./components/workload-container-grid";
import { useNodeOverview } from "@/hooks/monitoring/use-node-overview";
import { useNodeMetrics } from "@/hooks/monitoring/use-node-metrics";
import { ShieldAlert, AlertTriangle, RefreshCcw } from "lucide-react";
import { transformToChartData } from "./lib/utils/data-store-helpers";
import { WorkspaceBreadcrumbs } from "@/components/common/workspace-breadcrumbs";

interface MonitoringTelemetryViewportProps {
  nodeCode: string;
}

type RangeDuration = "1m" | "5m" | "15m" | "30m" | "1h" | "6h" | "24h";

// Helper function to calculate query parameters based on selected duration
const calculateQueryParams = (duration: RangeDuration) => {
  const nowMs = Date.now();
  let diffSec = 300;
  let intervalSec = 5;

  switch (duration) {
    // === LIVE METRICS (Bucket 5 giây) ===
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
      intervalSec = 15;
      break;
    case "30m":
      diffSec = 1800;
      intervalSec = 30;
      break;

    // === STANDARD / MINUTE METRICS (Bucket 60 giây) ===
    case "1h":
      diffSec = 3600; // 1 giờ
      intervalSec = 60; // Resolution 1 phút
      break;
    case "6h":
      diffSec = 21600; // 6 giờ
      intervalSec = 60; // Resolution 1 phút
      break;
    case "24h":
      diffSec = 86400; // 24 giờ
      intervalSec = 300; // Resolution 5 phút
      break;
  }

  const resolutionMs = intervalSec * 1000;
  const flooredFrom = new Date(
    Math.floor((nowMs - diffSec * 1000) / resolutionMs) * resolutionMs,
  );

  return {
    from: flooredFrom.toISOString(),
    interval: intervalSec.toString(),
  };
};

export default function MonitoringTelemetryViewport({
  nodeCode,
}: MonitoringTelemetryViewportProps) {
  const [rangeDuration, setRangeDuration] = useState<RangeDuration>("5m");
  const isLiveMode = rangeDuration === "1m" || rangeDuration === "5m";

  // Lazy state initializer runs once on mount to establish default 5m parameters cleanly
  const [queryParams, setQueryParams] = useState<
    { from?: string; interval?: string } | undefined
  >(() => calculateQueryParams("1h"));

  const handleRangeChange = useCallback((duration: RangeDuration) => {
    setRangeDuration(duration);
    setQueryParams(calculateQueryParams(duration));
  }, []);

  // Hook up active node overview snapshot and socket updates
  const { overview, loading: loadingOverview } = useNodeOverview(nodeCode);

  // Hook up active node metrics seed window and real-time streaming updates
  const { metrics, loading: loadingMetrics } = useNodeMetrics(nodeCode, {
    params: queryParams,
    isLive: isLiveMode, // Nếu isLive = false, hook sẽ gọi getNodeMetrics (Standard - 1m bucket)
  });

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

  const worstMetric = overview?.summaryMetrics.primaryIssue;
  const isViewportLoading = loadingOverview || loadingMetrics;

  return (
    <div
      className={`flex-1 flex flex-col p-4 space-y-4 overflow-hidden min-w-0 transition-opacity duration-200 ${
        isViewportLoading ? "opacity-60" : "opacity-100"
      }`}
    >
      {/* Top Bar Suite */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="">
          <WorkspaceBreadcrumbs />
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Sampling Rate Toggle */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-border/80 font-mono text-[9px]">
            {(["1m", "5m", "15m", "30m", "1h", "6h", "24h"] as const).map(
              (r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`px-2 py-1 rounded-sm uppercase font-semibold cursor-pointer ${
                    rangeDuration === r
                      ? "bg-cyan/15 text-cyan font-bold border border-cyan/20"
                      : "text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  {r}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Diagnostics Text Ticker Banner */}
      <div className="flex w-full items-center gap-2">
        <div className="panel rounded py-1.5 px-3 bg-slate-950 border border-border/80 flex items-center flex-1 gap-3 shrink-0 overflow-hidden font-mono text-[10px]">
          <div className="size-2 rounded-full bg-critical animate-ping shrink-0" />
          <div className="flex-1 truncate">
            {worstMetric?.metricKey ? (
              <span className="text-critical uppercase tracking-wider font-semibold animate-pulse">
                DIAGNOSTIC EXCURSION FAULT AT SITE: {worstMetric.metricKey} ={" "}
                {worstMetric.value}
              </span>
            ) : (
              <span className="text-emerald-400 uppercase tracking-wider">
                SYSTEM STATE OPTIMIZED — ZERO ACTIVE CRITICAL TELEMETRY
                EXCURSIONS DETECTED
              </span>
            )}
          </div>
        </div>
        {/* Alert Counters */}
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

      {/* Upper Grid (Node Hardware) */}
      <NodeHardwareGrid
        metrics={chartData}
        primaryNicStatus={
          overview?.summaryMetrics.primaryNicStatus
            ? { value: overview.summaryMetrics.primaryNicStatus, unit: "state" }
            : null
        }
      />

      {/* Lower Grid (Workloads) */}
      <WorkloadContainerGrid overview={overview} metrics={chartData} />
    </div>
  );
}
