"use client";

import { memo, useMemo, useRef, useEffect } from "react";
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
  const gridRef = useRef<HTMLDivElement>(null);
  const cpuChartRef = useRef<any>(null);
  const memChartRef = useRef<any>(null);
  const netChartRef = useRef<any>(null);
  const tempChartRef = useRef<any>(null);

  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      cpuChartRef.current?.getEchartsInstance()?.resize();
      memChartRef.current?.getEchartsInstance()?.resize();
      netChartRef.current?.getEchartsInstance()?.resize();
      tempChartRef.current?.getEchartsInstance()?.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
      timestamps.push(p.formattedTime);
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
      tempSeries,
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

  // Memoize Temperature Option with threshold markers (WARN/CRIT)
  const tempOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(20, 27, 45, 0.95)",
        borderColor: "rgba(255, 77, 109, 0.2)",
        textStyle: { color: "#f8fafc", fontSize: 9, fontFamily: "monospace" },
        formatter: (params: any) => {
          const val = params[0].value;
          return `TEMP: ${val !== null && val !== undefined ? val.toFixed(1) : "N/A"}°C`;
        }
      },
      grid: { top: 15, bottom: 20, left: 32, right: 32 },
      xAxis: {
        type: "category",
        data: extractedMetrics.timestamps,
        axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.08)" } },
        axisLabel: { color: "#64748b", fontSize: 8, fontFamily: "monospace" },
      },
      yAxis: {
        type: "value",
        min: 30,
        max: 100,
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748b",
          fontSize: 8,
          fontFamily: "monospace",
          formatter: "{value}°C",
        },
      },
      series: [
        {
          name: "Temperature",
          data: extractedMetrics.tempSeries,
          type: "line",
          smooth: true,
          showSymbol: false,
          connectNulls: true,
          lineStyle: {
            width: 1.5,
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#ff4d6d" },
                { offset: 0.5, color: "#ffc857" },
                { offset: 1, color: "#34d399" },
              ],
            },
          },
          markLine: {
            symbol: ["none", "none"],
            data: [
              {
                yAxis: 70,
                name: "WARN",
                lineStyle: {
                  color: "rgba(255, 200, 87, 0.5)",
                  type: "dashed",
                  width: 0.8,
                },
                label: {
                  position: "end",
                  formatter: "70°C",
                  color: "rgba(255, 200, 87, 0.8)",
                  fontSize: 7,
                  fontFamily: "monospace",
                },
              },
              {
                yAxis: 80,
                name: "CRIT",
                lineStyle: {
                  color: "rgba(255, 77, 109, 0.5)",
                  type: "dashed",
                  width: 0.8,
                },
                label: {
                  position: "end",
                  formatter: "80°C",
                  color: "rgba(255, 77, 109, 0.8)",
                  fontSize: 7,
                  fontFamily: "monospace",
                },
              },
            ],
          },
        },
      ],
    };
  }, [extractedMetrics.tempSeries, extractedMetrics.timestamps]);

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
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
      {/* CPU Panel */}
      <div className="panel col-span-2 p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48">
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
            ref={cpuChartRef}
            option={cpuOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ devicePixelRatio: 2 }}
          />
        </div>
      </div>

      {/* Network I/O Panel */}
      <div className="panel col-span-2 p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48">
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
            ref={netChartRef}
            option={networkOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ devicePixelRatio: 2 }}
          />
        </div>
      </div>

      {/* Primary System Disk Panel */}
      <div className="panel col-span-1 p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48 font-mono">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] text-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Database className="size-3.5 text-cyan-ice" /> Disk Usage
          </span>
          <span className="text-[10px] text-muted-foreground">Max Limit 85%</span>
        </div>

        {/* Circular Progress dial container */}
        <div className="flex-1 flex items-center justify-center relative mt-1.5">
          <div className="relative flex items-center justify-center">
            <svg height="120" width="120" className="rotate-[-90deg]">
              {/* Background Track Circle */}
              <circle
                stroke="rgba(255, 255, 255, 0.04)"
                fill="transparent"
                strokeWidth="8"
                r="46"
                cx="60"
                cy="60"
              />
              {/* Progress Circle with custom shadow-glow filter */}
              <circle
                className="transition-all duration-500 ease-out"
                stroke={extractedMetrics.latestDisk >= 85 ? "#ff4d6d" : "#00d1ff"}
                fill="transparent"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 - (Math.min(extractedMetrics.latestDisk, 100) / 100) * 2 * Math.PI * 46}
                strokeLinecap="round"
                r="46"
                cx="60"
                cy="60"
                style={{
                  filter: extractedMetrics.latestDisk >= 85 
                    ? "drop-shadow(0 0 6px rgba(255, 77, 109, 0.6))" 
                    : "drop-shadow(0 0 6px rgba(0, 209, 255, 0.4))",
                }}
              />
            </svg>
            {/* Text Overlay in exact center */}
            <div className="absolute flex flex-col items-center justify-center text-center font-mono">
              <span className="text-base font-extrabold text-foreground leading-none">
                {extractedMetrics.latestDisk.toFixed(0)}%
              </span>
              <span className="text-[8px] text-muted-foreground uppercase font-bold mt-1">
                used
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Temperature Panel */}
      <div className="panel p-3 bg-surface-2/40 border border-border/80 md:col-span-2 flex flex-col justify-between h-48 font-mono">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="size-3.5 text-amber" /> CPU Temperature
          </span>
          <span
            className={`text-xs font-bold ${
              extractedMetrics.latestTemp >= 80
                ? "text-critical drop-shadow-[0_0_8px_rgba(255,77,109,0.5)]"
                : extractedMetrics.latestTemp >= 70
                ? "text-amber drop-shadow-[0_0_8px_rgba(255,200,87,0.5)]"
                : "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
            }`}
          >
            {extractedMetrics.latestTemp.toFixed(0)}°C
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

      {/* Memory Panel */}
      <div className="panel col-span-1 p-3 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-48">
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
            ref={memChartRef}
            option={memoryOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ devicePixelRatio: 2 }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(NodeHardwareGrid);