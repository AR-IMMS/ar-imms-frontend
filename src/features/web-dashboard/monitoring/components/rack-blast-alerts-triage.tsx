'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  Loader2,
} from 'lucide-react';
import type { RackInvestigationOverviewResponse } from '@/types/monitoring';
import type { IncidentListItem } from '@/types/incident';
import { useRackTopologyQuery } from '@/hooks/asset/use-asset-queries';
import { useRackAndChildIncidentsQuery } from '@/hooks/incidents/use-incident-queries';

interface RackBlastAlertsTriageProps {
  overview: RackInvestigationOverviewResponse;
}

export function RackBlastAlertsTriage({
  overview,
}: RackBlastAlertsTriageProps) {
  const { rack } = overview;
  const { blastRadius } = rack;
  const rackId = rack.rackInfo.id;
  const router = useRouter();

  // 1. Fetch child nodes list from rack topology
  const { data: rackTopology } = useRackTopologyQuery(rackId, !!rackId);
  const nodeCodes = useMemo(() => {
    if (!rackTopology?.nodes) return [];
    return rackTopology.nodes.map((node) => node.nodeCode);
  }, [rackTopology]);

  // 2. Fetch incidents for rack and child node scopes dynamically
  const { data: incidentData, isLoading: isIncidentsLoading } =
    useRackAndChildIncidentsQuery(
      rackId,
      nodeCodes,
      nodeCodes.length >= 0,
      'CLOSED,RESOLVED'
    );

  const rackIncidents = useMemo(
    () => incidentData?.rackIncidents || [],
    [incidentData?.rackIncidents]
  );
  const childIncidents = useMemo(
    () => incidentData?.childIncidents || [],
    [incidentData?.childIncidents]
  );

  const [activeTab, setActiveTab] = useState<'rack' | 'child'>('rack');
  const [openChildAlert, setOpenChildAlert] = useState<string | null>(null);

  const badNodeRatioPct = Math.min(
    100,
    Math.max(0, blastRadius.badNodeRatio * 100)
  );

  const toggleChildAlert = (incidentId: string) => {
    setOpenChildAlert((prev) => (prev === incidentId ? null : incidentId));
  };

  const getTriageBadgeColor = (status: string) => {
    const stat = status?.toLowerCase();
    switch (stat) {
      case 'open':
      case 'new':
        return 'border-critical/30 bg-critical/10 text-critical';
      case 'acknowledged':
        return 'border-amber/30 bg-amber/10 text-amber';
      case 'resolved':
      case 'incident_created':
        return 'border-cyan/30 bg-cyan/10 text-cyan';
      case 'closed':
      case 'suppressed':
      default:
        return 'border-slate-700 bg-slate-800 text-slate-400';
    }
  };

  // Handle click on incident to navigate to details or tickets creation queue
  const handleIncidentClick = (incident: IncidentListItem) => {
    if (
      incident.ticketLinkage?.isLinked &&
      incident.ticketLinkage.tickets?.[0]?.id
    ) {
      const ticketId = incident.ticketLinkage.tickets[0].id;
      router.push(`/tickets/${ticketId}`);
    } else {
      router.push(`/tickets?create=true&incidentId=${incident.id}`);
    }
  };

  // Calculate dynamic critical/warning counts from active incidents
  const summary = useMemo(() => {
    const all = [...rackIncidents, ...childIncidents];
    const critical = all.filter(
      (inc) => inc.severity?.toUpperCase() === 'CRITICAL'
    ).length;
    const warning = all.filter(
      (inc) =>
        inc.severity?.toUpperCase() === 'WARNING' ||
        inc.severity?.toUpperCase() === 'HIGH'
    ).length;

    return {
      criticalCount: critical,
      warningCount: warning,
    };
  }, [rackIncidents, childIncidents]);

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
              onClick={() => setActiveTab('rack')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeTab === 'rack'
                  ? 'bg-cyan/15 text-cyan border border-cyan/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Rack Incidents ({rackIncidents.length})
            </button>
            <button
              onClick={() => setActiveTab('child')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ml-1 ${
                activeTab === 'child'
                  ? 'bg-cyan/15 text-cyan border border-cyan/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Node Incidents ({childIncidents.length})
            </button>
          </div>

          <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-500">
            <span>Summary: </span>
            <span className="text-slate-300">
              Crit: <b className="text-critical">{summary.criticalCount}</b>
            </span>
            <span className="text-slate-300">
              Warn: <b className="text-amber">{summary.warningCount}</b>
            </span>
          </div>
        </div>

        {/* Tab content scroll feed */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
          {isIncidentsLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <Loader2 className="size-5 animate-spin text-cyan" />
              <span className="text-[9px] uppercase">
                Retrieving active incidents...
              </span>
            </div>
          ) : activeTab === 'rack' ? (
            rackIncidents.length === 0 ? (
              <div className="text-[10px] text-center text-slate-500 italic p-3 border border-dashed border-border/40 rounded bg-slate-950/5">
                No active rack-scoped incidents firing
              </div>
            ) : (
              rackIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => handleIncidentClick(incident)}
                  className={`panel p-3 border rounded space-y-2 bg-slate-950/20 cursor-pointer hover:border-cyan/50 transition-all ${
                    incident.severity?.toLowerCase() === 'critical'
                      ? 'border-critical/30'
                      : 'border-amber/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 text-[9.5px]">
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-slate-200 uppercase truncate">
                        {incident.title}
                      </span>
                      <span className="text-[8px] text-slate-500 font-semibold mt-0.5">
                        Code:{' '}
                        <b className="text-slate-400">
                          {incident.incidentCode}
                        </b>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          incident.ticketLinkage?.isLinked
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 bg-slate-800 text-slate-400'
                        }`}
                      >
                        {incident.ticketLinkage?.isLinked
                          ? 'Linked'
                          : 'Not Linked'}
                      </span>
                      <span
                        className={`text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getTriageBadgeColor(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                  </div>

                  {incident.summary?.whatHappened && (
                    <p className="text-[8.5px] text-slate-400 leading-relaxed">
                      {incident.summary.whatHappened}
                    </p>
                  )}

                  {/* Incident Linked context */}
                  <div className="p-2 border border-cyan/20 bg-cyan/5 rounded text-[8px] space-y-1">
                    <div className="flex justify-between text-slate-300 font-extrabold">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3 text-cyan" />{' '}
                        {incident.primaryAlert?.name || 'Alert Firing'}
                      </span>
                      <span className="text-slate-400 font-bold">
                        {incident.ticketLinkage?.isLinked
                          ? `Ticket: ${incident.ticketLinkage.tickets[0].ticketCode}`
                          : 'No linked ticket'}
                      </span>
                    </div>
                    {incident.primaryAlert?.startedAt && (
                      <p className="text-slate-400 truncate font-semibold">
                        Started:{' '}
                        {new Date(
                          incident.primaryAlert.startedAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-3 pt-1.5 border-t border-border/10 text-[7.5px] font-bold justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {incident.links?.runbookUrl && (
                        <a
                          href={incident.links.runbookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                        >
                          <BookOpen className="size-2.5" /> Runbook
                        </a>
                      )}
                      {incident.links?.dashboardUrl && (
                        <a
                          href={incident.links.dashboardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                        >
                          <ExternalLink className="size-2.5" /> Dashboard
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleIncidentClick(incident)}
                      className="text-cyan hover:underline uppercase flex items-center gap-0.5 cursor-pointer"
                    >
                      {incident.ticketLinkage?.isLinked
                        ? 'View Ticket ➔'
                        : 'Create Ticket ➔'}
                    </button>
                  </div>
                </div>
              ))
            )
          ) : childIncidents.length === 0 ? (
            <div className="text-[10px] text-center text-slate-500 italic p-3 border border-dashed border-border/40 rounded bg-slate-950/5">
              No active child-scoped incidents firing
            </div>
          ) : (
            childIncidents.map((incident) => {
              const isOpen = openChildAlert === incident.id;
              const nodeName = incident.nodeCode;

              return (
                <div
                  key={incident.id}
                  className="border border-border/60 rounded bg-slate-950/15 overflow-hidden transition-all duration-150"
                >
                  <button
                    onClick={() => toggleChildAlert(incident.id)}
                    className="w-full flex justify-between items-center p-2.5 hover:bg-slate-900/40 text-left text-[9.5px]"
                  >
                    <div className="items-center justify-between min-w-0">
                      <div>
                        <span
                          className={`size-1.5 rounded-full shrink-0 ${
                            incident.severity?.toLowerCase() === 'critical'
                              ? 'bg-critical shadow-[0_0_6px_rgba(255,77,109,0.6)] animate-pulse'
                              : 'bg-amber'
                          }`}
                        />
                        <span
                          className="font-bold text-xs text-slate-200 max-w-1/2 truncate uppercase tooltip-text"
                          title={incident.title}
                        >
                          {incident.title}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate">
                          ({nodeName})
                        </span>
                      </div>
                      <div className="flex-1 items-center gap-1.5 mt-1">
                        <span
                          className={`text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            incident.ticketLinkage?.isLinked
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-slate-700 bg-slate-800 text-slate-400'
                          }`}
                        >
                          {incident.ticketLinkage?.isLinked
                            ? 'Linked'
                            : 'Not Linked'}
                        </span>
                        {/* <span
                          className={`text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getTriageBadgeColor(
                            incident.status,
                          )}`}
                        >
                          {incident.status}
                        </span> */}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="size-3 text-slate-500" />
                    ) : (
                      <ChevronDown className="size-3 text-slate-500" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-2.5 border-t border-border/40 bg-slate-950/20 text-[8.5px] space-y-2">
                      {incident.summary?.whatHappened && (
                        <p className="text-slate-400 leading-relaxed">
                          {incident.summary.whatHappened}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-1.5 text-[8px] border-t border-border/10 pt-2 font-mono">
                        <div>
                          <span className="text-slate-500 uppercase block text-[7px]">
                            Category
                          </span>
                          <span className="text-slate-300 font-semibold">
                            {incident.primaryAlert?.category || '--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase block text-[7px]">
                            Triage Status
                          </span>
                          <span
                            className={`font-semibold px-1 rounded uppercase border ${
                              getTriageBadgeColor(incident.status).split(' ')[0]
                            }`}
                          >
                            {incident.status}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 uppercase block text-[7px]">
                            Incident Code
                          </span>
                          <span
                            className="text-slate-300 truncate block font-semibold"
                            title={incident.incidentCode}
                          >
                            {incident.incidentCode}
                          </span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-2 border border-cyan/20 bg-cyan/5 rounded text-[8px] space-y-1 mt-2">
                        <div className="flex justify-between text-slate-300 font-extrabold">
                          <span className="flex items-center gap-1">
                            <FileText className="size-3 text-cyan" />{' '}
                            {incident.primaryAlert?.name || 'Alert Firing'}
                          </span>
                          <span className="text-slate-400 font-bold">
                            {incident.ticketLinkage?.isLinked
                              ? `Ticket: ${incident.ticketLinkage.tickets[0].ticketCode}`
                              : 'No linked ticket'}
                          </span>
                        </div>
                        {incident.primaryAlert?.startedAt && (
                          <p className="text-slate-400 truncate font-semibold">
                            Started:{' '}
                            {new Date(
                              incident.primaryAlert.startedAt
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 pt-2 border-t border-border/10 text-[7.5px] font-bold justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {incident.links?.runbookUrl && (
                            <a
                              href={incident.links.runbookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                            >
                              <BookOpen className="size-2.5" /> Runbook
                            </a>
                          )}
                          {incident.links?.dashboardUrl && (
                            <a
                              href={incident.links.dashboardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-cyan hover:underline uppercase"
                            >
                              <ExternalLink className="size-2.5" /> Dashboard
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleIncidentClick(incident)}
                          className="text-cyan hover:underline uppercase flex items-center gap-0.5 cursor-pointer"
                        >
                          {incident.ticketLinkage?.isLinked
                            ? 'View Ticket ➔'
                            : 'Create Ticket ➔'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
          <span className="text-slate-500 text-[8px] block uppercase font-bold tracking-widest">
            Blast Impact Area
          </span>
          <span
            className={`text-2xl font-extrabold ${
              badNodeRatioPct > 0
                ? 'text-critical text-glow'
                : 'text-emerald-400'
            }`}
          >
            {badNodeRatioPct.toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-400 block mt-1 uppercase">
            {blastRadius.badNodes} of {blastRadius.totalNodes} total nodes
            impacted
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[7.5px] text-slate-500 uppercase font-semibold">
            <span>Aggregated Status</span>
            <span>Ratio Distribution</span>
          </div>
          <div className="h-4 w-full rounded bg-slate-950/60 overflow-hidden flex border border-border/30 p-0.5 gap-0.5">
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
                title={`Healthy: ${
                  blastRadius.totalNodes -
                  (blastRadius.criticalNodes +
                    blastRadius.warningNodes +
                    blastRadius.staleNodes +
                    blastRadius.silentDeadNodes)
                } nodes`}
              />
            )}
          </div>
        </div>

        {/* Legend / Info grid */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[7.5px] uppercase font-bold mt-2">
          <div className="bg-slate-950/20 border border-border/20 p-1 rounded">
            <span className="text-[6.5px] text-slate-500 block">Critical</span>
            <b className="text-critical text-[9px]">
              {blastRadius.criticalNodes}
            </b>
          </div>
          <div className="bg-slate-950/20 border border-border/20 p-1 rounded">
            <span className="text-[6.5px] text-slate-500 block">Warning</span>
            <b className="text-amber text-[9px]">{blastRadius.warningNodes}</b>
          </div>
          <div className="bg-slate-950/20 border border-border/20 p-1 rounded">
            <span className="text-[6.5px] text-slate-500 block">Stale</span>
            <b className="text-purple text-[9px]">{blastRadius.staleNodes}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
