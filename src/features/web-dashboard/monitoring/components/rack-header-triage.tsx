"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ShieldAlert, Cpu, AlertTriangle } from "lucide-react";
import type { RackInvestigationOverviewResponse } from "@/types/monitoring";
import { SEVERITY_COLOR_TEXT } from "../lib/constant";

interface RackHeaderTriageProps {
  rackId: string;
  overview: RackInvestigationOverviewResponse;
}

export function RackHeaderTriage({ rackId, overview }: RackHeaderTriageProps) {
  const { healthStatus, culprit } = overview.rack;

  const isFailedOrSignalLoss = healthStatus.isRackLevelFailure || healthStatus.hasSignalLoss;

  const severityColorClass = useMemo(() => {
    const sev = healthStatus.severityText.toLowerCase();
    return SEVERITY_COLOR_TEXT[sev] || "text-slate-400";
  }, [healthStatus.severityText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 font-mono">
      {/* 1. Health Badge Panel */}
      <div className="panel p-4 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-28 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-cyan" /> Health Assessment
          </span>
          <span className="text-[8px] text-slate-500">SYSTEM STATS</span>
        </div>

        <div className="flex items-center justify-between gap-3 mt-1.5 flex-1 min-h-0">
          <div className="flex flex-col">
            <span className={`text-xl font-extrabold tracking-wide uppercase ${severityColorClass}`}>
              {healthStatus.severityText}
            </span>
          </div>

          {isFailedOrSignalLoss && (
            <div className="flex items-center gap-1.5 bg-critical/15 text-critical border border-critical/30 px-2 py-1 rounded animate-pulse text-[9px] font-bold shadow-[0_0_8px_rgba(255,77,109,0.15)] uppercase">
              <AlertTriangle className="size-3.5" />
              <span>Rack Failure / Signal Loss Detected</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Culprit Focus Card */}
      <div className="panel p-4 bg-surface-2/40 border border-border/80 flex flex-col justify-between h-28 relative overflow-hidden">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-critical" /> WORST PERFORMING NODE
          </span>
          <span className="text-[8px] text-slate-500">Culprit</span>
        </div>

        {culprit.worstNodeId ? (
          <div className="flex justify-between items-end mt-1.5">
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Primary Fault:</span>
              <div
                className="text-sm font-bold text-cyan truncate max-w-[180px] flex items-center gap-1 mt-0.5 uppercase"
              >
                <Cpu className="size-3" /> {culprit.worstNodeId}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-500 uppercase block font-semibold">
                {culprit.worstMetricKey}
              </span>
              <span className="text-sm font-extrabold text-slate-200">
                {culprit.worstMetricValueText || culprit.worstMetricValueNumeric || "--"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-semibold italic mt-3">
            No worst node culprit flagged
          </div>
        )}
      </div>
    </div>
  );
}
