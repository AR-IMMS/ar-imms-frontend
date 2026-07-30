"use client";

import { useMemo, memo, useRef, useEffect } from "react";
import { ShieldAlert, CheckCircle, RefreshCcw } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { ChartDataPoint, NodeOverviewData, WorkloadItem } from "@/types/monitoring";

interface WorkloadContainerGridProps {
  overview: NodeOverviewData | null;
  metrics: ChartDataPoint[] | null;
}

interface WorkloadCardProps {
  workload: WorkloadItem;
  cpuSeries: (number | null)[];
  memSeries: (number | null)[];
}

// 1. Pure Helper Color Resolver
const getLoadColor = (value: number) => {
  if (value >= 80) return "#ff4d6d"; // Neon Red
  if (value >= 50) return "#ffc857"; // Warning Amber
  return "#00d1ff"; // Neon Cyan
};

// 2. Pure Factory function tạo Sparkline Option
const buildSparklineOption = (data: (number | null)[], color: string) => {
  return {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: "category", show: false },
    yAxis: { type: "value", min: 0, max: 100, show: false },
    series: [
      {
        data,
        type: "line",
        smooth: true,
        showSymbol: false,
        connectNulls: true,
        lineStyle: { width: 1.2, color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}33` },
              { offset: 1, color: "transparent" },
            ],
          },
        },
      },
    ],
  };
};

// 3. Sub-component cho từng Card, bọc memo để ngăn re-render dư thừa
const WorkloadCard = memo(function WorkloadCard({
  workload,
  cpuSeries,
  memSeries,
}: WorkloadCardProps) {
  const latestCpu = cpuSeries.length > 0 ? cpuSeries[cpuSeries.length - 1] ?? 0 : 0;
  const latestMem = memSeries.length > 0 ? memSeries[memSeries.length - 1] ?? 0 : 0;

  const cpuColor = getLoadColor(latestCpu);
  const memColor = getLoadColor(latestMem);

  const cpuOption = useMemo(
    () => buildSparklineOption(cpuSeries, cpuColor),
    [cpuSeries, cpuColor]
  );

  const memOption = useMemo(
    () => buildSparklineOption(memSeries, memColor),
    [memSeries, memColor]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const cpuChartRef = useRef<any>(null);
  const memChartRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const cpuInstance = cpuChartRef.current?.getEchartsInstance();
      if (cpuInstance) {
        cpuInstance.resize();
      }
      const memInstance = memChartRef.current?.getEchartsInstance();
      if (memInstance) {
        memInstance.resize();
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const isAbnormal =
    workload.healthStatus?.toLowerCase().trim() === "unhealthy" ||
    workload.status?.toLowerCase().trim() !== "running" ||
    workload.restartCount > 0;

  return (
    <div
      ref={containerRef}
      className={`panel bg-surface-2/30 p-3 border flex flex-col justify-between h-44 transition-all duration-200 hover:border-cyan/40 hover:shadow-[0_0_12px_rgba(0,209,255,0.05)] ${
        isAbnormal
          ? "border-critical/30 bg-critical/5 shadow-[0_0_8px_rgba(255,77,109,0.05)]"
          : "border-border/50"
      }`}
    >
      {/* Header Container Identity */}
      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <span
            className="font-mono font-bold text-slate-200 text-[10px] truncate max-w-[100px]"
            title={workload.name}
          >
            {workload.name}
          </span>
          {isAbnormal ? (
            <span className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border bg-critical/15 text-critical border-critical/35 animate-pulse">
              ALARM
            </span>
          ) : (
            <span className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
              OK
            </span>
          )}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>
            Type: <b className="text-slate-400">{workload.type}</b>
          </span>
          <span>
            Restarts: <b className="text-slate-400">{workload.restartCount}</b>
          </span>
        </div>
      </div>

      {/* Sparkline Analytics */}
      <div className="space-y-2 mt-2 border-t border-border/20 pt-2 flex-1 flex flex-col justify-end">
        {/* CPU Sparkline */}
        <div className="flex items-center justify-between gap-2 h-7">
          <div className="flex flex-col text-[8.5px] font-mono leading-none">
            <span className="text-muted-foreground">CPU</span>
            <span className="font-bold text-[9.5px] mt-0.5" style={{ color: cpuColor }}>
              {latestCpu.toFixed(1)}%
            </span>
          </div>
          <div className="flex-1 h-6">
            <ReactECharts
              ref={cpuChartRef}
              option={cpuOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ devicePixelRatio: 2 }}
            />
          </div>
        </div>

        {/* Memory Sparkline */}
        <div className="flex items-center justify-between gap-2 h-7">
          <div className="flex flex-col text-[8.5px] font-mono leading-none">
            <span className="text-muted-foreground">MEM</span>
            <span className="font-bold text-[9.5px] mt-0.5" style={{ color: memColor }}>
              {latestMem.toFixed(1)}%
            </span>
          </div>
          <div className="flex-1 h-6">
            <ReactECharts
              ref={memChartRef}
              option={memOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ devicePixelRatio: 2 }}
            />
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="border-t border-border/10 pt-1.5 mt-2 flex items-center justify-between font-mono text-[8px] text-muted-foreground">
        <span className="truncate max-w-[80px]">
          Rule: {workload.primaryIssue?.metricKey || "none"}
        </span>
        <span
          className={`uppercase font-bold ${
            workload.status === "running" ? "text-emerald-400" : "text-amber"
          }`}
        >
          {workload.status}
        </span>
      </div>
    </div>
  );
});

function WorkloadContainerGrid({
  overview,
  metrics,
}: WorkloadContainerGridProps) {
  const summary = overview?.workloadSummary || { total: 0, unhealthy: 0, healthy: 0 };
  const workloads = overview?.workloads || [];

  // Lấy ra 5 workload đầu tiên
  const topWorkloads = useMemo(() => workloads.slice(0, 5), [workloads]);

  // Single-pass Series Extraction: Lặp qua metrics đúng 1 lần duy nhất cho tất cả workloads
  const workloadSeriesMap = useMemo(() => {
    const map: Record<
      string,
      { cpuSeries: (number | null)[]; memSeries: (number | null)[] }
    > = {};

    if (!metrics || topWorkloads.length === 0) return map;

    // Khởi tạo mảng rỗng cho từng workload
    for (let i = 0; i < topWorkloads.length; i++) {
      const id = topWorkloads[i].workloadId;
      map[id] = { cpuSeries: [], memSeries: [] };
    }

    // Duyệt duy nhất 1 vòng lặp qua metrics
    for (let i = 0; i < metrics.length; i++) {
      const point = metrics[i];
      for (let j = 0; j < topWorkloads.length; j++) {
        const id = topWorkloads[j].workloadId;
        const wlMetrics = point.workloads?.[id];
        map[id].cpuSeries.push(wlMetrics?.cpuUsagePct ?? null);
        map[id].memSeries.push(wlMetrics?.memoryUsagePct ?? null);
      }
    }

    return map;
  }, [metrics, topWorkloads]);

  return (
    <div className="mt-3 space-y-2 flex-1 flex flex-col min-h-0">
      {/* Header Summary */}
      <div className="flex justify-between items-center shrink-0 border-b border-border pb-2 font-mono text-xs">
        <span className="font-bold text-slate-300 uppercase tracking-wider">
          Workload & Container Topology Matrix
        </span>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>
            Total Containers: <b className="text-slate-200">{summary.total}</b>
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="size-3 text-critical" />
            Unhealthy:{" "}
            <b
              className={
                summary.unhealthy > 0
                  ? "text-critical font-bold animate-pulse"
                  : "text-slate-200"
              }
            >
              {summary.unhealthy}
            </b>
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <RefreshCcw className="size-3 text-slate-400" />
            Healthy: <b className="text-slate-200">{summary.healthy}</b>
          </span>
        </div>
      </div>

      {/* Grid Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {topWorkloads.map((wl: WorkloadItem) => {
          const series = workloadSeriesMap[wl.workloadId] || {
            cpuSeries: [],
            memSeries: [],
          };

          return (
            <WorkloadCard
              key={wl.workloadId}
              workload={wl}
              cpuSeries={series.cpuSeries}
              memSeries={series.memSeries}
            />
          );
        })}

        {workloads.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground/40 font-mono text-xs border border-dashed border-border/30 rounded-lg flex flex-col items-center justify-center gap-1.5">
            <CheckCircle className="size-5 text-slate-500" />
            <span>No active workloads running on this host</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(WorkloadContainerGrid);