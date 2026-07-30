"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShieldAlert, AlertTriangle, RefreshCcw, ArrowRight, Activity, Clock, Cpu } from "lucide-react";
import type { RackInvestigationOverviewResponse, RackNodeSnapshotItem } from "@/types/monitoring";
import { formatToExactDateTime } from "@/lib/utils/formatTime";
import { useRackTopologyQuery } from "@/hooks/asset/use-asset-queries";

interface RackProblemNodeGridProps {
  rackId: string;
  overview: RackInvestigationOverviewResponse;
}

// Mini progress bar with null/missing data fallback
function MiniProgressBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const isAvailable = value !== null && value !== undefined;
  const pct = isAvailable ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className="flex flex-col gap-0.5 w-full font-mono text-[8.5px]">
      <div className="flex justify-between items-baseline text-slate-400 font-semibold">
        <span>{label}</span>
        <span className={isAvailable ? "text-slate-300" : "text-slate-500 font-normal"}>
          {isAvailable ? `${pct.toFixed(0)}%` : "--"}
        </span>
      </div>
      <div className="h-1.5 w-full rounded bg-slate-950/60 overflow-hidden flex border border-border/10 p-[1px]">
        {isAvailable ? (
          <div
            className="h-full rounded-[1px] transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              boxShadow: `0 0 4px ${color}80`,
            }}
          />
        ) : (
          <div className="h-full flex-1 bg-white/5" />
        )}
      </div>
    </div>
  );
}

function NodeSnapshotCard({
  rackId,
  item,
  nodeAssetId,
}: {
  rackId: string;
  item: RackNodeSnapshotItem;
  nodeAssetId?: string;
}) {
  const isStale = item.freshnessSec > 60;

  const severityColor = useMemo(() => {
    switch (item.severity) {
      case "critical":
      case "high":
        return "border-critical/30 bg-critical/5 hover:border-critical/50 text-critical shadow-[inset_0_0_8px_rgba(255,77,109,0.02)]";
      case "warning":
        return "border-amber/30 bg-amber/5 hover:border-amber/50 text-amber shadow-[inset_0_0_8px_rgba(255,200,87,0.02)]";
      case "stale":
        return "border-purple/30 bg-purple/5 hover:border-purple/50 text-purple shadow-[inset_0_0_8px_rgba(139,92,246,0.02)]";
      case "healthy":
      default:
        return "border-border/50 bg-slate-950/20 hover:border-cyan/40 text-slate-300";
    }
  }, [item.severity]);

  const formattedLastSeen = useMemo(() => {
    return formatToExactDateTime(item.lastSeenAt);
  }, [item.lastSeenAt]);

  const actualNodeId = nodeAssetId || item.nodeId;

  return (
    <Link
      href={`/monitoring/${rackId}/${actualNodeId}`}
      className={`panel p-3 border flex flex-col justify-between h-[180px] transition-all duration-200 cursor-pointer select-none font-mono ${severityColor} ${
        isStale ? "opacity-60" : "opacity-100"
      }`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start shrink-0">
        <span className="text-[10px] font-bold tracking-tight truncate max-w-[110px]" title={item.nodeId}>
          {item.nodeId}
        </span>
        <div className="flex items-center gap-1">
          <span className={`text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded border shrink-0 ${
            item.status === "alerting"
              ? "border-critical/30 bg-critical/15 text-critical animate-pulse"
              : "border-slate-800 bg-slate-900/50 text-slate-400"
          }`}>
            {item.status}
          </span>
        </div>
      </div>

      {/* Hardware Metrics Progress list */}
      <div className="space-y-1.5 mt-1.5 flex-1 min-h-0">
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-1">
          <MiniProgressBar label="CPU" value={item.currentMetrics.cpuUsagePct} color="#00d1ff" />
          <MiniProgressBar label="RAM" value={item.currentMetrics.memoryUsedPct} color="#34d399" />
          <MiniProgressBar label="DISK" value={item.currentMetrics.diskUsedPct} color="#a78bfa" />
          
          <div className="flex flex-col gap-0.5 font-mono text-[8.5px]">
            <span className="text-slate-400 font-semibold">TEMP</span>
            <span className={item.currentMetrics.cpuTemperatureC !== null ? "text-slate-200 font-bold" : "text-slate-500"}>
              {item.currentMetrics.cpuTemperatureC !== null ? `${item.currentMetrics.cpuTemperatureC.toFixed(0)}°C` : "--"}
            </span>
          </div>
        </div>

        {/* Worst performance issue readout */}
        <div className="text-[8.5px] text-slate-400 border-t border-border/10 pt-1.5 flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 uppercase font-semibold">Worst:</span>
          {item.worstMetric.metricKey ? (
            <span className="font-bold text-slate-300 truncate max-w-[120px]" title={item.worstMetric.metricKey}>
              {item.worstMetric.metricKey} = {item.worstMetric.metricValueText || item.worstMetric.metricValueNumeric}
            </span>
          ) : (
            <span className="text-slate-500 italic">None</span>
          )}
        </div>
      </div>

      {/* Freshness, status and Counter strip */}
      <div className="border-t border-border/10 pt-1.5 mt-1.5 shrink-0 flex items-center justify-between text-[7px] text-slate-500 font-semibold">
        <span className="flex items-center gap-0.5 shrink-0" title={`Last seen: ${formattedLastSeen} | Collector: ${item.collectorStatus}`}>
          <Clock className="size-2 text-slate-600" /> {item.freshnessSec}s lag
        </span>
        <div className="flex items-center gap-1 font-mono text-[7px] scale-95 origin-right">
          <div className="flex items-center gap-0.5 bg-critical/10 text-critical px-1 py-0.2 rounded border border-critical/20">
            <ShieldAlert className="size-2" />
            <span>{item.alertCounters.criticalMetricCount}</span>
          </div>
          <div className="flex items-center gap-0.5 bg-amber/10 text-amber px-1 py-0.2 rounded border border-amber/20">
            <AlertTriangle className="size-2" />
            <span>{item.alertCounters.warningMetricCount}</span>
          </div>
          <div className="flex items-center gap-0.5 bg-purple/10 text-purple px-1 py-0.2 rounded border border-purple/20">
            <RefreshCcw className="size-2" />
            <span>{item.alertCounters.staleMetricCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function RackProblemNodeGrid({ rackId, overview }: RackProblemNodeGridProps) {
  const { nodeSnapshot, navigation } = overview;
  const { data: rackTopology } = useRackTopologyQuery(rackId, !!rackId);

  const nodeCodeToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    if (rackTopology?.nodes) {
      rackTopology.nodes.forEach((node) => {
        map.set(node.nodeCode, node.id);
      });
    }
    return map;
  }, [rackTopology]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between font-mono border-b border-border/40 pb-2">
        <div className="flex items-baseline gap-2.5">
          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="size-3.5 text-cyan" /> Node Investigation Snapshot
          </h3>
          <span className="text-[9px] text-muted-foreground font-semibold">
            ({nodeSnapshot.returned} of {nodeSnapshot.totalNodes} total nodes)
          </span>
          <span className="text-[9px] bg-slate-900 border border-border/40 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
            Mode: {nodeSnapshot.selectionMode}
          </span>
        </div>
      </div>

      {/* Snapshot Cards Grid */}
      <div>
        {nodeSnapshot.items.length === 0 ? (
          <div className="panel p-8 bg-surface-2/20 border border-border/50 flex flex-col items-center justify-center text-center font-mono h-36">
            <span className="text-slate-500 text-[10px] font-semibold uppercase">
              Zero active problematic node snapshots reported
            </span>
            <span className="text-[8px] text-slate-600 mt-1 uppercase">
              All child entities reporting healthy states
            </span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodeSnapshot.items.map((item) => {
              const nodeAssetId = nodeCodeToIdMap.get(item.nodeId);
              return (
                <NodeSnapshotCard
                  key={item.nodeId}
                  rackId={rackId}
                  item={item}
                  nodeAssetId={nodeAssetId}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* View All Nodes Navigation CTA */}
      {/* <div className="flex justify-center pt-2">
        <Link
          href={navigation.nodesUrl || `/monitoring/racks/${rackId}/nodes`}
          className="flex items-center justify-center gap-2 text-[10px] font-bold text-cyan bg-cyan/5 hover:bg-cyan/15 border border-cyan/40 px-5 py-2.5 rounded transition-all duration-150 uppercase font-mono tracking-wider w-full text-center"
        >
          View All {nodeSnapshot.totalNodes} Nodes in Rack <ArrowRight className="size-3.5" />
        </Link>
      </div> */}
    </div>
  );
}
