"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import {
  Cpu,
  Thermometer,
  Database,
  Network,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
} from "lucide-react";
import type { RackInvestigationOverviewResponse } from "@/types/monitoring";

interface RackAggregateGridProps {
  overview: RackInvestigationOverviewResponse;
}

// Custom Segmented Progress Bar component
function SegmentedProgressBar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const totalSegments = 20;
  const activeSegments = Math.round((value / 100) * totalSegments);

  return (
    <div className="flex flex-col gap-1 w-full font-mono">
      <div className="flex justify-between items-baseline text-[9px] text-slate-400">
        <span className="font-semibold">
          {label}:{" "}
          {value !== null && value !== undefined
            ? `${value.toFixed(1)}%`
            : "--"}
        </span>
        <span>LOAD</span>
      </div>
      <div className="flex gap-0.5 items-center bg-slate-950/40 p-1 rounded border border-border/40 h-5">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          return (
            <div
              key={i}
              className="flex-1 h-full rounded-[1px] transition-all duration-300"
              style={{
                backgroundColor: isActive ? color : "rgba(255, 255, 255, 0.03)",
                boxShadow: isActive ? `0 0 6px ${color}80` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Auto-scaling throughput formatter
function formatThroughput(bytesPerSec: number | null): string {
  if (bytesPerSec === null || bytesPerSec === undefined) return "--";
  if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(1)} B/s`;
  const kb = bytesPerSec / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB/s`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB/s`;
}

export function RackAggregateGrid({ overview }: RackAggregateGridProps) {
  const { aggregateMetrics, trend } = overview.rack;

  const rx = aggregateMetrics.sumNetworkRxBytesSec || 0;
  const tx = aggregateMetrics.sumNetworkTxBytesSec || 0;

  // 1. Roll client-side network history for line chart visualization
  const [netHistory, setNetHistory] = useState<
    { rx: number; tx: number; time: string }[]
  >([]);

  useEffect(() => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setNetHistory((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.rx === rx && last.tx === tx) return prev;
      }
      const next = [...prev, { rx, tx, time }];
      if (next.length > 12) next.shift(); // keep rolling 12 points
      return next;
    });
  }, [rx, tx]);

  // 2. Setup ECharts references for layout resize tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const tempChartRef = useRef<any>(null);
  const diskChartRef = useRef<any>(null);
  const netChartRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      tempChartRef.current?.getEchartsInstance()?.resize();
      diskChartRef.current?.getEchartsInstance()?.resize();
      netChartRef.current?.getEchartsInstance()?.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 3. ECharts Gauge options factory
  const getGaugeOption = (value: number | null, color: string, max = 100) => {
    const val = value || 0;
    return {
      series: [
        {
          type: "gauge",
          min: 0,
          max,
          startAngle: 200,
          endAngle: -20,
          splitNumber: 5,
          radius: "105%",
          center: ["50%", "60%"],
          pointer: {
            show: true,
            width: 2.5,
            length: "55%",
            itemStyle: { color: "#cbd5e1" },
          },
          axisLine: {
            lineStyle: {
              width: 4,
              color: [
                [0.5, "rgba(52, 211, 153, 0.1)"],
                [0.8, "rgba(255, 200, 87, 0.1)"],
                [1, "rgba(255, 77, 109, 0.1)"],
              ],
            },
          },
          progress: { show: true, width: 4, itemStyle: { color } },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          anchor: { show: true, size: 5, itemStyle: { color: "#cbd5e1" } },
          detail: {
            formatter: () =>
              value !== null && value !== undefined
                ? `${value.toFixed(0)}`
                : "--",
            color: "#f1f5f9",
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: "bold",
            offsetCenter: [0, "30%"],
          },
          data: [{ value: val }],
        },
      ],
    };
  };

  const tempOption = useMemo(
    () => getGaugeOption(aggregateMetrics.maxCpuTemperatureC, "#ffc857", 120),
    [aggregateMetrics.maxCpuTemperatureC],
  );

  const diskOption = useMemo(
    () => getGaugeOption(aggregateMetrics.maxDiskUsedPct, "#00d1ff"),
    [aggregateMetrics.maxDiskUsedPct],
  );

  const isTempCritical = (aggregateMetrics.maxCpuTemperatureC || 0) >= 80;

  // 4. ECharts Network history area chart options
  const networkOption = useMemo(() => {
    const times = netHistory.map((h) => h.time);
    const rxData = netHistory.map((h) => h.rx);
    const txData = netHistory.map((h) => h.tx);

    const formatter = (val: number) => {
      if (val === 0) return "0 B";
      if (val < 1024) return `${val.toFixed(0)} B`;
      const kb = val / 1024;
      if (kb < 1024) return `${kb.toFixed(0)} K`;
      const mb = kb / 1024;
      return `${mb.toFixed(0)} M`;
    };

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(20, 27, 45, 0.95)",
        borderColor: "rgba(0, 209, 255, 0.2)",
        textStyle: { color: "#f8fafc", fontSize: 9, fontFamily: "monospace" },
        formatter: (params: any) => {
          let html = `<span style="font-size:8px;color:#64748b">${params[0].name}</span><br/>`;
          params.forEach((p: any) => {
            html += `<span style="color:${p.color}">${p.seriesName}: <b>${formatThroughput(p.value)}</b></span><br/>`;
          });
          return html;
        },
      },
      grid: { top: 12, bottom: 20, left: 52, right: 10 },
      xAxis: {
        type: "category",
        data: times,
        axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
        axisLabel: { color: "#64748b", fontSize: 8, fontFamily: "monospace" },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)" } },
        axisLabel: {
          color: "#64748b",
          fontSize: 8,
          fontFamily: "monospace",
          formatter,
        },
      },
      series: [
        {
          name: "Rx Input",
          data: rxData,
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.2, color: "#38bdf8" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.12)" },
                { offset: 1, color: "transparent" },
              ],
            },
          },
        },
        {
          name: "Tx Output",
          data: txData,
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.2, color: "#8b5cf6" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(139, 92, 246, 0.12)" },
                { offset: 1, color: "transparent" },
              ],
            },
          },
        },
      ],
    };
  }, [netHistory]);

  return (
    <div className=" space-y-3 shrink-0">
      {/* 1. Header Delta Trends strip */}
      <div className="flex justify-between items-center bg-slate-900/40 border border-border/60 px-4 py-2 rounded font-mono text-[10px]">
        <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <RefreshCcw className="size-3 text-cyan" /> Aggregate Telemetry
          Metrics
        </span>
        <div className="flex items-center gap-3.5 text-[10px]">
          <div className="flex items-center gap-1.5 border-r border-border/40 pr-3.5">
            <span className="text-slate-500 uppercase">Delta 1m:</span>
            <span
              className={`font-bold flex items-center gap-0.5 ${trend.delta1m > 0 ? "text-critical animate-pulse" : trend.delta1m < 0 ? "text-emerald-400" : "text-slate-400"}`}
            >
              {trend.delta1m > 0 ? (
                <>
                  <TrendingUp className="size-3" /> +{trend.delta1m} alerts
                </>
              ) : trend.delta1m < 0 ? (
                <>
                  <TrendingDown className="size-3" /> {trend.delta1m} alerts
                </>
              ) : (
                "0 alerts"
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase">Delta 5m:</span>
            <span
              className={`font-bold flex items-center gap-0.5 ${trend.delta5m > 0 ? "text-critical animate-pulse" : trend.delta5m < 0 ? "text-emerald-400" : "text-slate-400"}`}
            >
              {trend.delta5m > 0 ? (
                <>
                  <TrendingUp className="size-3" /> +{trend.delta5m} alerts
                </>
              ) : trend.delta5m < 0 ? (
                <>
                  <TrendingDown className="size-3" /> {trend.delta5m} alerts
                </>
              ) : (
                "0 alerts"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid of 5 hardware metrics */}
      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 font-mono"
      >
        {/* 1. CPU & Memory load bars */}
        <div className="panel col-span-1 p-3.5 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-[178px]">
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Cpu className="size-3.5 text-cyan" /> Processor / RAM
            </span>
          </div>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <SegmentedProgressBar
              value={aggregateMetrics.avgCpuUsagePct || 0}
              color="#00d1ff"
              label="CPU"
            />
            <SegmentedProgressBar
              value={aggregateMetrics.avgMemoryUsedPct || 0}
              color="#34d399"
              label="RAM"
            />
          </div>
        </div>

        {/* 2. CPU Temperature Gauge */}
        <div
          className={`panel col-span-1 p-3.5 bg-surface-2/40 border flex flex-col justify-between h-[178px] transition-all duration-300 ${
            isTempCritical
              ? "border-critical/60 shadow-[0_0_12px_rgba(255,77,109,0.2)] animate-pulse"
              : "border-border/80"
          }`}
        >
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Thermometer className="size-3.5 text-amber" /> Peak Thermal Gauge
            </span>
            <span
              className={`text-[9px] font-bold ${isTempCritical ? "text-critical" : "text-slate-400"}`}
            >
              {aggregateMetrics.maxCpuTemperatureC !== null &&
              aggregateMetrics.maxCpuTemperatureC !== undefined
                ? `${aggregateMetrics.maxCpuTemperatureC.toFixed(0)}°C`
                : "--"}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ReactECharts
              ref={tempChartRef}
              option={tempOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ devicePixelRatio: 2 }}
            />
          </div>
        </div>

        {/* 3. Disk Ceiling Gauge */}
        <div className="panel col-span-1 p-3.5 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-[178px]">
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Database className="size-3.5 text-cyan-ice" /> Disk Ceiling Gauge
            </span>
            <span className="text-[9px] text-slate-400 font-bold">
              {aggregateMetrics.maxDiskUsedPct !== null &&
              aggregateMetrics.maxDiskUsedPct !== undefined
                ? `${aggregateMetrics.maxDiskUsedPct.toFixed(0)}%`
                : "--"}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ReactECharts
              ref={diskChartRef}
              option={diskOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ devicePixelRatio: 2 }}
            />
          </div>
        </div>

        {/* 4. Network Line Area chart */}
        <div className="panel col-span-1 md:col-span-2 p-3.5 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-[178px]">
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <Network className="size-3.5 text-purple" /> Network I/O Traffic
            </span>
            <span
              className="text-[8px] text-slate-500 shrink-0 font-semibold"
              title={`Rx: ${formatThroughput(rx)} | Tx: ${formatThroughput(tx)}`}
            >
              Rx: {formatThroughput(rx)} / Tx: {formatThroughput(tx)}
            </span>
          </div>
          
          <div className="flex-1 min-h-0 mt-1">
            <ReactECharts
              ref={netChartRef}
              option={networkOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ devicePixelRatio: 2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
