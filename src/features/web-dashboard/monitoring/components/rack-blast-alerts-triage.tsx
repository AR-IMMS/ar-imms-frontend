"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, FileText, Activity } from "lucide-react";
import type { RackInvestigationOverviewResponse } from "@/types/monitoring";

interface RackBlastAlertsTriageProps {
  overview: RackInvestigationOverviewResponse;
}

export function RackBlastAlertsTriage({ overview }: RackBlastAlertsTriageProps) {
  const { rack, alerts } = overview;
  const { blastRadius } = rack;

  const [activeTab, setActiveTab] = useState<"rack" | "child">("rack");
  const [openChildAlert, setOpenChildAlert] = useState<string | null>(null);

  const badNodeRatioPct = Math.min(100, Math.max(0, blastRadius.badNodeRatio * 100));

  const toggleChildAlert = (fingerprint: string) => {
    setOpenChildAlert((prev) => (prev === fingerprint ? null : fingerprint));
  };

  const getTriageBadgeColor = (status: string) => {
    switch (status) {
      case "new":
        return "border-critical/30 bg-critical/10 text-critical";
      case "acknowledged":
        return "border-amber/30 bg-amber/10 text-amber";
      case "incident_created":
        return "border-cyan/30 bg-cyan/10 text-cyan";
      case "suppressed":
      default:
        return "border-slate-700 bg-slate-800 text-slate-400";
    }
  };

  // Calculate proportion segment widths for Blast Radius bar
  const segments = useMemo(() => {
    const total = blastRadius.totalNodes || 1;
    const critVal = blastRadius.criticalNodes || 0;
    const warnVal = blastRadius.warningNodes || 0;
    const staleVal = blastRadius.staleNodes || 0;
    const deadVal = blastRadius.silentDeadNodes || 0;
    const badTotal = critVal + warnVal + staleVal + deadVal;
    const healthyVal = Math.max(0, total - badTotal);

    return {
      criticalPct: (critVal / total) * 100,
      warningPct: (warnVal / total) * 100,
      stalePct: (staleVal / total) * 100,
      deadPct: (deadVal / total) * 100,
      healthyPct: (healthyVal / total) * 100,
    };
  }, [blastRadius]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0 font-mono">
      {/* Column 1 & 2: Alerts Triage Suite (Toggles) */}
      <div className="lg:col-span-2 panel p-4 bg-surface-2/40 border border-border/80 flex flex-col h-[280px]">
        {/* Header Tab Selectors */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3 shrink-0">
          <div className="flex bg-slate-950/40 p-0.5 rounded border border-border/40 text-[9px] font-bold uppercase">
            <button
              onClick={() => setActiveTab("rack")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeTab === "rack"
                  ? "bg-cyan/15 text-cyan border border-cyan/30 font-bold"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              Rack Alerts ({alerts.rack.length})
            </button>
            <button
              onClick={() => setActiveTab("child")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ml-1 ${
                activeTab === "child"
                  ? "bg-cyan/15 text-cyan border border-cyan/30 font-bold"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              Node Alerts ({alerts.child.length})
            </button>
          </div>

          <div className="flex gap-2 text-[9px] uppercase font-bold text-slate-500">
            <span>Summary: </span>
            <span className="text-slate-300">Crit: <b className="text-critical">{alerts.summary.criticalCount}</b></span>
            <span className="text-slate-300">Warn: <b className="text-amber">{alerts.summary.warningCount}</b></span>
          </div>
        </div>

        {/* Tab content scroll feed */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
          {activeTab === "rack" ? (
            alerts.rack.length === 0 ? (
              <div className="text-[10px] text-center text-slate-500 italic p-3 border border-dashed border-border/40 rounded bg-slate-950/5">
                No active rack-scoped alerts firing 
              </div>
            ) : (
              alerts.rack.map((alert) => (
                <div
                  key={alert.fingerprint}
                  className={`panel p-3 border rounded space-y-2 bg-slate-950/20 ${
                    alert.severity === "critical" ? "border-critical/30" : "border-amber/30"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 text-[9.5px]">
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-slate-200 uppercase truncate">
                        {alert.alertName}
                      </span>
                      {alert.metricKey && (
                        <span className="text-[8px] text-slate-500 font-semibold mt-0.5">
                          Threshold: <b className="text-slate-400">{alert.currentValue || "--"}</b> vs <b className="text-slate-400">{alert.threshold}</b>
                        </span>
                      )}
                    </div>
                    <span className={`text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${getTriageBadgeColor(alert.triageStatus)}`}>
                      {alert.triageStatus}
                    </span>
                  </div>
                  <p className="text-[8.5px] text-slate-400 leading-relaxed">
                    {alert.summary}
                  </p>

                  {/* Incident linked details */}
                  {alert.incident && (
                    <div className="p-2 border border-cyan/20 bg-cyan/5 rounded text-[8px] space-y-1">
                      <div className="flex justify-between text-slate-300 font-extrabold">
                        <span className="flex items-center gap-1">
                          <FileText className="size-3 text-cyan" /> {alert.incident.incidentCode} ({alert.incident.status})
                        </span>
                        <span className={alert.incident.severity === "CRITICAL" ? "text-critical" : "text-cyan"}>
                          {alert.incident.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 truncate font-semibold">
                        {alert.incident.title}
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center gap-3 pt-1.5 border-t border-border/10 text-[7.5px] font-bold">
                    {alert.runbookUrl && (
                      <a
                        href={alert.runbookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                      >
                        <BookOpen className="size-2.5" /> Runbook
                      </a>
                    )}
                    {alert.dashboardUrl && (
                      <a
                        href={alert.dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                      >
                        <ExternalLink className="size-2.5" /> Dashboard
                      </a>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            alerts.child.length === 0 ? (
              <div className="text-[10px] text-center text-slate-500 italic p-3 border border-dashed border-border/40 rounded bg-slate-950/5">
                No active child-scoped alerts firing
              </div>
            ) : (
              alerts.child.map((alert) => {
                const isOpen = openChildAlert === alert.fingerprint;
                return (
                  <div
                    key={alert.fingerprint}
                    className="border border-border/60 rounded bg-slate-950/15 overflow-hidden transition-all duration-150"
                  >
                    <button
                      onClick={() => toggleChildAlert(alert.fingerprint)}
                      className="w-full flex justify-between items-center p-2.5 hover:bg-slate-900/40 text-left text-[9.5px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-1.5 rounded-full shrink-0 ${
                          alert.severity === "critical"
                            ? "bg-critical shadow-[0_0_6px_rgba(255,77,109,0.6)] animate-pulse"
                            : "bg-amber"
                        }`} />
                        <span className="font-bold text-xs text-slate-200 truncate uppercase">
                          {alert.alertName}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate">
                          ({alert.nodeId})
                        </span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="size-3 text-slate-500" />
                      ) : (
                        <ChevronDown className="size-3 text-slate-500" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-2.5 border-t border-border/40 bg-slate-950/20 text-[9px] space-y-2">
                        <p className="text-slate-400 leading-relaxed">
                          Alert summary: {alert.summary}
                        </p>
                        <div className="grid grid-cols-4 gap-2 border-t border-border/10 pt-2 font-mono">
                          <div>
                            <span className="text-slate-500 uppercase block text-[8px]">Category</span>
                            <span className="text-slate-300 font-semibold text-[9px] uppercase">{alert.category}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase block text-[8px]">Triage Status</span>
                            <span className={`font-semibold px-1 rounded uppercase border ${getTriageBadgeColor(alert.triageStatus).split(" ")[0]}`}>
                              {alert.triageStatus}
                            </span>
                          </div>
                          {alert.metricKey && (
                            <div className="col-span-2">
                              <span className="text-slate-500 uppercase block text-[8px]">Metric Key</span>
                              <span className="text-slate-300 truncate block font-semibold" title={alert.metricKey}>
                                {alert.metricKey} = {alert.currentValue || "--"} (Thresh: {alert.threshold})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Linked Incident */}
                        {alert.incident && (
                          <div className="p-2 border border-cyan/20 bg-cyan/5 rounded text-[8px] space-y-1 mt-2">
                            <div className="flex justify-between text-slate-300 font-extrabold">
                              <span className="flex items-center gap-1">
                                <FileText className="size-3 text-cyan" /> {alert.incident.incidentCode}
                              </span>
                              <span className={alert.incident.severity === "CRITICAL" ? "text-critical" : "text-cyan"}>
                                {alert.incident.severity}
                              </span>
                            </div>
                            <p className="text-slate-400 truncate font-semibold">
                              {alert.incident.title}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-3 border-t border-border/10 text-[8px] font-bold">
                          {alert.runbookUrl && (
                            <a
                              href={alert.runbookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                            >
                              <BookOpen className="size-2.5" /> Runbook
                            </a>
                          )}
                          {alert.dashboardUrl && (
                            <a
                              href={alert.dashboardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                            >
                              <ExternalLink className="size-2.5" /> Dashboard
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* Column 3: Blast Radius Visualizer */}
      <div className="panel p-4 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-[280px]">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Activity className="size-3.5 text-cyan" /> Blast Radius Visualizer
          </span>
          <span className="text-[8px] text-slate-500">RACK IMPACT</span>
        </div>

        {/* Prominent percentage readout */}
        <div className="my-2 text-center p-3.5 mx-auto w-full max-w-[220px] bg-slate-950/40 rounded border border-border/40">
          <span className={`text-2xl font-extrabold ${badNodeRatioPct > 0 ? "text-critical text-glow" : "text-emerald-400"}`}>
            {badNodeRatioPct.toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-400 block mt-1 uppercase">
            {blastRadius.badNodes} of {blastRadius.totalNodes} total nodes impacted
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8.5px] text-slate-500 uppercase font-semibold">
            <span>Aggregated Status</span>
            <span>Ratio Distribution</span>
          </div>
          <div className="h-4 w-full rounded-2xl bg-slate-950/60 overflow-hidden flex border border-border/30 p-0.5 gap-0.5">
            {segments.criticalPct > 0 && (
              <div
                className="bg-critical h-full rounded-[1px] transition-all duration-500 shadow-[0_0_6px_rgba(255,77,109,0.3)]"
                style={{ width: `${segments.criticalPct}%` }}
                title={`Critical: ${blastRadius.criticalNodes} nodes`}
              />
            )}
            {segments.warningPct > 0 && (
              <div
                className="bg-amber h-full rounded-[1px] transition-all duration-500 shadow-[0_0_6px_rgba(255,200,87,0.3)]"
                style={{ width: `${segments.warningPct}%` }}
                title={`Warning: ${blastRadius.warningNodes} nodes`}
              />
            )}
            {segments.stalePct > 0 && (
              <div
                className="bg-purple h-full rounded-[1px] transition-all duration-500"
                style={{ width: `${segments.stalePct}%` }}
                title={`Stale: ${blastRadius.staleNodes} nodes`}
              />
            )}
            {segments.deadPct > 0 && (
              <div
                className="bg-purple/80 h-full rounded-[1px] transition-all duration-500"
                style={{ width: `${segments.deadPct}%` }}
                title={`Dead: ${blastRadius.silentDeadNodes} nodes`}
              />
            )}
            {segments.healthyPct > 0 && (
              <div
                className="bg-emerald-400/80 h-full rounded-[1px] transition-all duration-500"
                style={{ width: `${segments.healthyPct}%` }}
                title={`Healthy: ${blastRadius.totalNodes - (blastRadius.criticalNodes + blastRadius.warningNodes + blastRadius.staleNodes + blastRadius.silentDeadNodes)} nodes`}
              />
            )}
          </div>
        </div>

        {/* Legend / Info grid */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] uppercase font-bold mt-2">
          <div className="bg-slate-950/20 border border-border/20 p-1 rounded">
            <span className="text-[8.5px] text-slate-500 block">Critical</span>
            <b className="text-critical text-lg">{blastRadius.criticalNodes}</b>
          </div>
          <div className="bg-slate-950/20 border border-border/20 p-1 rounded">
            <span className="text-[8.5px] text-slate-500 block">Warning</span>
            <b className="text-amber text-lg">{blastRadius.warningNodes}</b>
          </div>
          <div className="bg-slate-950/20 border border-border/20 p-1 rounded">
            <span className="text-[8.5px] text-slate-500 block">Stale</span>
            <b className="text-purple text-lg">{blastRadius.staleNodes}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
