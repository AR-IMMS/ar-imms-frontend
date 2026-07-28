"use client";

import { memo, useMemo } from "react";
import { Activity, Cpu, Thermometer, Database } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { ChartDataPoint } from "@/types/monitoring";
import { buildLineChartOption, formatBytes, getLatestValue } from "../lib/utils/metrics-chart-helpers";

type NetworkTooltipParam = {
  name: string;
  color: string;
  seriesName: string;
  value: number | null;
};

interface NodeHardwareGridProps {
  metrics: ChartDataPoint[] | null;
  primaryNicStatus: { value: string | null; unit: string | null } | null;
}

function NodeHardwareGrid({
  metrics,
  primaryNicStatus,
}: NodeHardwareGridProps) {
  const extractedMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        timestamps: [],
        cpuSeries: [],
        memSeries: [],
        rxSeries: [],
        txSeries: [],
        latestCpu: 0,
        latestMem: 0,
        latestDisk: 0,
        latestTemp: 0,
      };
    }

    const timestamps: string[] = [];
    const cpuSeries: (number | null)[] = [];
    const memSeries: (number | null)[] = [];
    const rxSeries: (number | null)[] = [];
    const txSeries: (number | null)[] = [];
    const diskSeries: (number | null)[] = [];
    const tempSeries: (number | null)[] = [];

    for (let i = 0; i < metrics.length; i++) {
      const p = metrics[i];
      timestamps.push(
        new Date(p.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      cpuSeries.push(p.cpuUsagePct);
      memSeries.push(p.memoryUsagePct);
      rxSeries.push(p.networkRxBytesSec);
      txSeries.push(p.networkTxBytesSec);
      diskSeries.push(p.diskUsagePct);
      tempSeries.push(p.cpuTemperatureC);
    }

    return {
      timestamps,
      cpuSeries,
      memSeries,
      rxSeries,
      txSeries,
      latestCpu: getLatestValue(cpuSeries),
      latestMem: getLatestValue(memSeries),
      latestDisk: getLatestValue(diskSeries),
      latestTemp: getLatestValue(tempSeries),
    };
  }, [metrics]);

  // Memoize CPU Option
  const cpuOption = useMemo(() => {
    return buildLineChartOption(
      extractedMetrics.cpuSeries,
      extractedMetrics.timestamps,
      "CPU",
      "#00d1ff"
    );
  }, [extractedMetrics.cpuSeries, extractedMetrics.timestamps]);

  // Memoize Memory Option
  const memoryOption = useMemo(() => {
    return buildLineChartOption(
      extractedMetrics.memSeries,
      extractedMetrics.timestamps,
      "Memory",
      "#38bdf8"
    );
  }, [extractedMetrics.memSeries, extractedMetrics.timestamps]);

  // Memoize Network Option
  const networkOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(20, 27, 45, 0.95)",
        borderColor: "rgba(0, 209, 255, 0.2)",
        textStyle: { color: "#f8fafc", fontSize: 10, fontFamily: "monospace" },
        formatter: (params: NetworkTooltipParam[]) => {
          let html = `<span style="font-size:9px;color:#64748b">${params[0].name}</span><br/>`;
          params.forEach((p) => {
            html += `<span style="color:${p.color}">${p.seriesName}: <b>${formatBytes(
              p.value
            )}</b></span><br/>`;
          });
          return html;
        },
      },
      legend: {
        data: ["Rx Input", "Tx Output"],
        textStyle: { color: "#94a3b8", fontSize: 9, fontFamily: "monospace" },
        right: 10,
        top: 0,
      },
      grid: { top: 25, bottom: 20, left: 45, right: 10 },
      xAxis: {
        type: "category",
        data: extractedMetrics.timestamps,
        axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
        axisLabel: { color: "#64748b", fontSize: 9, fontFamily: "monospace" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)" } },
        axisLabel: {
          color: "#64748b",
          fontSize: 9,
          fontFamily: "monospace",
          formatter: (value: number) => formatBytes(value).split(" ")[0],
        },
      },
      series: [
        {
          name: "Rx Input",
          data: extractedMetrics.rxSeries,
          type: "line",
          smooth: true,
          showSymbol: false,
          connectNulls: true,
          lineStyle: { width: 1.5, color: "#38bdf8" },
        },
        {
          name: "Tx Output",
          data: extractedMetrics.txSeries,
          type: "line",
          smooth: true,
          showSymbol: false,
          connectNulls: true,
          lineStyle: { width: 1.5, color: "#8b5cf6" },
        },
      ],
    };
  }, [
    extractedMetrics.rxSeries,
    extractedMetrics.txSeries,
    extractedMetrics.timestamps,
  ]);

  const isDormant =
    primaryNicStatus?.value?.trim().toLowerCase() === "dormant";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
      {/* CPU Panel */}
      <div className="panel p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48">
        <div className="flex justify-between items-center px-1">
          <span className="font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="size-3.5 text-cyan" /> Core CPU Utilization
          </span>
          <span className="font-mono text-xs font-bold text-cyan">
            {extractedMetrics.latestCpu.toFixed(1)}%
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <ReactECharts
            option={cpuOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ devicePixelRatio: 2 }}
          />
        </div>
      </div>

      {/* Memory Panel */}
      <div className="panel p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48">
        <div className="flex justify-between items-center px-1">
          <span className="font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="size-3.5 text-cyan-ice" /> Memory Occupancy
          </span>
          <span className="font-mono text-xs font-bold text-cyan-ice">
            {extractedMetrics.latestMem.toFixed(1)}%
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <ReactECharts
            option={memoryOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ devicePixelRatio: 2 }}
          />
        </div>
      </div>

      {/* Network I/O Panel */}
      <div className="panel p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48">
        <div className="flex justify-between items-center px-1">
          <span className="font-mono text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="size-3.5 text-purple" /> Network Throughput
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
            <span>NIC:</span>
            <div
              className={`size-2 rounded-full shadow-[0_0_8px] ${
                isDormant
                  ? "bg-slate-500 shadow-slate-500/50"
                  : "bg-emerald-400 shadow-emerald-400/50"
              }`}
            />
            <span className="font-semibold uppercase">
              {primaryNicStatus?.value || "offline"}
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ReactECharts
            option={networkOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ devicePixelRatio: 2 }}
          />
        </div>
      </div>

      {/* Primary System Disk Panel */}
      <div className="panel p-4 bg-surface-2/40 border border-border/80 md:col-span-2 flex flex-col justify-between h-28 font-mono">
        <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Database className="size-3.5 text-cyan-ice" /> Primary System Disk
          </span>
          <span className="text-slate-400">KINGSTON SNV2S1000G</span>
        </div>

        <div className="flex justify-between items-baseline mt-1 text-[10px] text-slate-400">
          <span>Capacity Usage</span>
          <span className="text-xs font-bold text-slate-200">
            {extractedMetrics.latestDisk.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-slate-950/60 h-2.5 rounded-full border border-border/50 overflow-hidden mt-1.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              extractedMetrics.latestDisk >= 85
                ? "bg-critical shadow-[0_0_8px_rgba(255,77,109,0.5)] animate-pulse"
                : "bg-cyan shadow-[0_0_6px_rgba(0,209,255,0.3)]"
            }`}
            style={{ width: `${extractedMetrics.latestDisk}%` }}
          />
        </div>

        <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-1">
          <span>Sector Health: nominal</span>
          <span>Max Limit 85%</span>
        </div>
      </div>

      {/* Core Temperature Panel */}
      <div className="panel p-4 bg-surface-2/40 border border-border/80 md:col-span-1 flex flex-col justify-between h-28 font-mono">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>CPU TEMPERATURE</span>
          <Thermometer className="size-4 text-amber" />
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span
            className={`text-2xl font-extrabold tracking-tight transition-all duration-300 ${
              extractedMetrics.latestTemp >= 80
                ? "text-critical drop-shadow-[0_0_8px_rgba(255,77,109,0.6)] font-glow-red"
                : extractedMetrics.latestTemp >= 70
                ? "text-amber drop-shadow-[0_0_8px_rgba(255,200,87,0.5)]"
                : "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            }`}
            style={{
              textShadow:
                extractedMetrics.latestTemp >= 80
                  ? "0 0 10px rgba(255,77,109,0.4)"
                  : extractedMetrics.latestTemp >= 70
                  ? "0 0 10px rgba(255,200,87,0.3)"
                  : "0 0 10px rgba(52,211,153,0.3)",
            }}
          >
            {extractedMetrics.latestTemp.toFixed(0)}
          </span>
          <span className="text-xs text-slate-500 font-semibold">°C</span>
        </div>

        <div className="w-full bg-slate-950/60 h-2 rounded-full border border-border/40 overflow-hidden mt-1.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              extractedMetrics.latestTemp >= 80
                ? "bg-critical shadow-[0_0_6px_rgba(255,77,109,0.5)] animate-pulse"
                : extractedMetrics.latestTemp >= 70
                ? "bg-amber shadow-[0_0_6px_rgba(255,200,87,0.5)]"
                : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]"
            }`}
            style={{ width: `${Math.min(extractedMetrics.latestTemp, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-1">
          <span>WARN ≥ 70°C</span>
          <span>CRIT ≥ 80°C</span>
        </div>
      </div>
    </div>
  );
}

export default memo(NodeHardwareGrid);