"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Database,
  ExternalLink,
  GitBranch,
  LayoutDashboard,
  RadioTower,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import Header from "@/components/layout/web-dashboard/header";
import { useIncidentDetailQuery } from "@/hooks/incidents/use-incident-queries";
import { useUpdateTicketStatusMutation } from "@/hooks/tickets/use-ticket-mutations";
import { useTicketDetailQuery } from "@/hooks/tickets/use-ticket-queries";
import type { IncidentDetail } from "@/types/incident";
import type { Ticket, TicketActivity, TicketStatus } from "@/types/ticket";
import { formatDateTime, STATUS_OPTIONS } from "../lib/ticket-ui";

type TicketInvestigationPageProps = {
  ticketId: string;
};

export default function TicketInvestigationPage({
  ticketId,
}: TicketInvestigationPageProps) {
  const ticketQuery = useTicketDetailQuery(ticketId);
  const ticket = ticketQuery.data ?? null;
  const incidentQuery = useIncidentDetailQuery(ticket?.incidentId, Boolean(ticket));
  const incident = incidentQuery.data ?? null;
  const updateStatusMutation = useUpdateTicketStatusMutation();

  async function updateStatus(status: TicketStatus) {
    if (!ticket || status === ticket.status) {
      return;
    }

    await updateStatusMutation.mutateAsync({
      ticketId: ticket.id,
      status,
    });
  }

  return (
    <main className="ticket-readable h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
        <Header
          eyebrow="TICKET // INCIDENT INVESTIGATION"
          title="Ticket Detail"
          subtitle="Single-ticket command view with linked incident evidence and operational context."
          actions={
            <Link
              href="/tickets/me"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-cyan-ice transition hover:bg-cyan/15"
            >
              <ArrowLeft className="size-3.5" />
              Back to Queue
            </Link>
          }
        />

        {ticketQuery.isLoading ? <TicketDetailSkeleton /> : null}

        {ticketQuery.isError ? (
          <StatePanel
            title="Ticket could not be loaded"
            description="The ticket detail API returned an error or the ticket is no longer available."
          />
        ) : null}

        {ticket ? (
          <div className="grid min-h-0 grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_520px]">
            <section className="flex min-w-0 flex-col gap-5" aria-label="Incident viewport">
              {incidentQuery.isLoading ? (
                <StatePanel
                  title="Loading incident evidence"
                  description="Fetching linked incident facts from the incident workflow service."
                />
              ) : null}

              {incidentQuery.isError ? (
                <StatePanel
                  title="Incident detail unavailable"
                  description="This can happen when the ticket is not linked to an incident or the backend denies access to the linked incident."
                />
              ) : null}

              {incident ? (
                <>
                  <HeroAlertBanner incident={incident} />
                  <MetricGrid incident={incident} />
                  <IncidentSummary incident={incident} />
                  <EvidenceTable incident={incident} />
                  <RelatedIncidents incident={incident} />
                  <SystemProvenance incident={incident} />
                </>
              ) : null}
            </section>

            <TicketCommandPanel
              ticket={ticket}
              incident={incident}
              isUpdatingStatus={updateStatusMutation.isPending}
              onStatusChange={updateStatus}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function HeroAlertBanner({ incident }: { incident: IncidentDetail }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-critical/45 bg-critical/8 p-5 shadow-[0_0_34px_rgba(255,0,85,0.16)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-critical to-transparent" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-critical/50 bg-critical/15 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.18em] text-critical">
              <span className="size-2 animate-pulse rounded-full bg-critical shadow-[0_0_12px_rgba(255,0,85,0.85)]" />
              {incident.state.severity}
            </span>
            {incident.summary.urgency ? (
              <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
                {incident.summary.urgency}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-balance font-sans text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {incident.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="text-cyan">{incident.incidentCode}</span>
            <span>Created {formatDateTime(incident.state.createdAt)}</span>
          </div>
        </div>
        <ShieldAlert className="size-12 shrink-0 text-critical/70" aria-hidden />
      </div>
    </section>
  );
}

function MetricGrid({ incident }: { incident: IncidentDetail }) {
  const impact = incident.sourceFacts.impact;
  const trigger = incident.sourceFacts.trigger;
  const affected = impact?.affectedNodeCount ?? 0;
  const total = impact?.totalNodeCount ?? 0;
  const impactPercent =
    typeof impact?.affectedRatio === "number"
      ? `${Math.round(impact.affectedRatio * 100)}%`
      : "unknown";

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Key incident metrics">
      <KpiCard
        label="AFFECTED NODES RATIO"
        value={`${affected} / ${total}`}
        subtext={`Impact: ${impactPercent}`}
        tone="critical"
      />
      <KpiCard
        label="TRIGGER METRIC"
        value={`${trigger?.currentValue ?? "-"} ${trigger?.unit ?? ""}`.trim()}
        subtext={`Threshold: ${trigger?.threshold ?? "-"} | Key: ${trigger?.metricKey ?? "-"}`}
        tone="amber"
      />
    </section>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  tone: "critical" | "amber";
}) {
  const toneClass =
    tone === "critical"
      ? "border-critical/40 text-critical shadow-[0_0_22px_rgba(255,0,85,0.12)]"
      : "border-amber/40 text-amber shadow-[0_0_22px_rgba(255,153,0,0.12)]";

  return (
    <div className={`rounded-2xl border bg-surface-1/70 p-5 ${toneClass}`}>
      <div className="label-mono text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-3 font-mono text-4xl font-black tracking-tight">
        {value}
      </div>
      <div className="mt-2 font-mono text-xs text-muted-foreground">{subtext}</div>
    </div>
  );
}

function IncidentSummary({ incident }: { incident: IncidentDetail }) {
  const alert = incident.sourceFacts.alert;

  return (
    <section className="panel p-5" aria-labelledby="incident-summary-title">
      <div className="flex items-center gap-2">
        <RadioTower className="size-4 text-cyan" aria-hidden />
        <h2 id="incident-summary-title" className="label-mono text-xs text-cyan">
          Incident Summary & Context
        </h2>
      </div>
      <p className="mt-4 font-mono text-sm leading-7 text-foreground">
        {incident.summary.whatHappened}
      </p>
      <dl className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Fact label="Alert Name" value={alert?.name} />
        <Fact label="Category" value={alert?.category} />
        <Fact label="Environment" value={alert?.environment} />
        <Fact label="Team" value={alert?.team} />
        <Fact label="Fingerprint" value={alert?.fingerprint} />
      </dl>
    </section>
  );
}

function EvidenceTable({ incident }: { incident: IncidentDetail }) {
  const metrics = incident.evidence.metrics ?? [];
  const window = incident.evidence.window;

  return (
    <section className="panel overflow-hidden" aria-labelledby="evidence-title">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-cyan" aria-hidden />
          <h2 id="evidence-title" className="label-mono text-xs text-cyan">
            Evidence Snapshot
          </h2>
        </div>
        <span className="label-mono text-[10px] text-muted-foreground">
          {incident.evidence.type} · {incident.evidence.completeness ?? "unknown"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left font-mono text-xs">
          <thead className="bg-surface-1/70 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Metric Label</th>
              <th className="px-5 py-3">Key</th>
              <th className="px-5 py-3">Value (Unit)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {metrics.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-muted-foreground" colSpan={3}>
                  No metric evidence was included in the incident snapshot.
                </td>
              </tr>
            ) : (
              metrics.map((metric) => (
                <tr key={metric.metricKey} className="odd:bg-white/[0.015]">
                  <td className="px-5 py-3 text-foreground">
                    {metric.label ?? metric.metricKey}
                  </td>
                  <td className="px-5 py-3 text-cyan">{metric.metricKey}</td>
                  <td className="px-5 py-3 text-amber">
                    {metric.value ?? "-"} {metric.unit ?? ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted-foreground">
        Window: {formatDateTime(window?.from)} → {formatDateTime(window?.to)} · Interval:{" "}
        {window?.interval ?? "-"}
      </div>
    </section>
  );
}

function RelatedIncidents({ incident }: { incident: IncidentDetail }) {
  const related = incident.relatedIncidents ?? [];

  return (
    <section className="panel overflow-hidden" aria-labelledby="related-incidents-title">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <GitBranch className="size-4 text-cyan" aria-hidden />
        <h2 id="related-incidents-title" className="label-mono text-xs text-cyan">
          Related Incidents Log
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left font-mono text-xs">
          <thead className="bg-surface-1/70 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Incident Code</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Severity</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {related.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-muted-foreground" colSpan={5}>
                  No related incidents were returned for this scope.
                </td>
              </tr>
            ) : (
              related.map((item) => (
                <tr key={item.id} className="odd:bg-white/[0.015]">
                  <td className="px-5 py-3 text-cyan">{item.incidentCode}</td>
                  <td className="max-w-[360px] truncate px-5 py-3 text-foreground">
                    {item.title}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={item.severity === "CRITICAL" ? "critical" : "cyan"}>
                      {item.severity}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={item.status === "OPEN" ? "green" : "muted"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemProvenance({ incident }: { incident: IncidentDetail }) {
  const refs = incident.sourceRefs ?? [];

  return (
    <details className="panel group p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Database className="size-4 text-cyan" aria-hidden />
          <span className="label-mono text-xs text-cyan">
            System Provenance ({refs.length} Sources)
          </span>
        </span>
        <span className="font-mono text-xs text-muted-foreground group-open:text-cyan">
          EXPAND
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        {refs.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">
            No source references were returned.
          </p>
        ) : (
          refs.map((ref, index) => (
            <div
              key={`${ref.system ?? "source"}-${ref.dataset ?? "dataset"}-${index}`}
              className="rounded-xl border border-border bg-background/25 p-4 font-mono text-xs"
            >
              <div className="text-cyan">{ref.system ?? "-"}</div>
              <div className="mt-1 text-foreground">{ref.dataset ?? "-"}</div>
              <div className="mt-2 text-muted-foreground">
                Observed: {ref.observedAt ?? "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </details>
  );
}

function TicketCommandPanel({
  ticket,
  incident,
  isUpdatingStatus,
  onStatusChange,
}: {
  ticket: Ticket;
  incident: IncidentDetail | null;
  isUpdatingStatus: boolean;
  onStatusChange: (status: TicketStatus) => void;
}) {
  const runbookUrl = ticket.metadata?.runbookUrl ?? incident?.links?.runbookUrl;
  const dashboardUrl =
    ticket.metadata?.dashboardUrl ?? incident?.links?.dashboardUrl;
  const linkedTickets = incident?.tickets ?? [];

  return (
    <aside className="flex min-w-0 flex-col gap-5" aria-label="Ticket control panel">
      <section className="panel p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-cyan" aria-hidden />
          <h2 className="label-mono text-xs text-cyan">Workflow Control</h2>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="label-mono text-[10px] text-muted-foreground">Status</span>
            <select
              value={ticket.status}
              disabled={isUpdatingStatus}
              onChange={(event) => onStatusChange(event.target.value as TicketStatus)}
              className="rounded-lg border border-cyan/25 bg-background px-3 py-2.5 font-mono text-xs text-cyan-ice outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20 disabled:opacity-60"
            >
              {STATUS_OPTIONS.filter((status) => status !== "ALL").map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="label-mono text-[10px] text-muted-foreground">
              Priority
            </span>
            <select
              value={ticket.priority}
              disabled
              className="rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-xs text-muted-foreground opacity-80"
            >
              <option>{ticket.priority}</option>
            </select>
            <span className="font-mono text-[10px] text-muted-foreground">
              Priority update is not exposed by the current ticket API.
            </span>
          </label>

          <div className="rounded-xl border border-border bg-surface-1/45 p-4">
            <div className="label-mono text-[10px] text-muted-foreground">Action</div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full border border-cyan/35 bg-cyan/10 text-cyan">
                  <UserRound className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    Assigned technician
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {ticket.assigneeUserId ?? "Unassigned"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Reassign
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
        <ShortcutLink
          href={runbookUrl}
          icon={<BookOpen className="size-4" aria-hidden />}
          label="Open Runbook"
        />
        <ShortcutLink
          href={dashboardUrl}
          icon={<LayoutDashboard className="size-4" aria-hidden />}
          label="View Live Dashboard"
        />
      </section>

      <section className="panel p-5">
        <h2 className="label-mono text-xs text-cyan">Asset Hierarchy</h2>
        <div className="mt-4 grid gap-3 font-mono text-xs">
          <PathNode label="SITE" value={ticket.metadata?.site ?? incident?.sourceFacts.asset?.siteCode} />
          <PathNode label="ROOM" value={ticket.metadata?.room ?? incident?.sourceFacts.asset?.roomCode} />
          <PathNode label="RACK" value={ticket.assetRef?.displayName ?? incident?.sourceFacts.asset?.rackCode} />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="label-mono text-xs text-cyan">Linked Tickets</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {linkedTickets.length === 0 ? (
            <span className="font-mono text-xs text-muted-foreground">
              No linked tickets returned by the incident API.
            </span>
          ) : (
            linkedTickets.map((linkedTicket) => (
              <Link
                key={linkedTicket.id}
                href={`/tickets/${linkedTicket.id}`}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition ${
                  linkedTicket.id === ticket.id
                    ? "border-neon-green/45 bg-neon-green/10 text-neon-green"
                    : "border-cyan/25 bg-cyan/8 text-cyan-ice hover:border-cyan/45"
                }`}
              >
                {linkedTicket.id === ticket.id ? "ACTIVE · " : ""}
                {linkedTicket.id}
              </Link>
            ))
          )}
        </div>
      </section>

      <ActivityTimeline activities={ticket.activities ?? []} />
    </aside>
  );
}

function ActivityTimeline({ activities }: { activities: TicketActivity[] }) {
  return (
    <section className="panel p-5" aria-labelledby="activity-title">
      <h2 id="activity-title" className="label-mono text-xs text-cyan">
        Activity Timeline
      </h2>
      <div className="mt-5 grid gap-4">
        {activities.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">
            No activity events were returned.
          </p>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className="grid grid-cols-[32px_minmax(0,1fr)] gap-3"
            >
              <div className="relative flex justify-center">
                <span className="z-10 grid size-7 place-items-center rounded-full border border-cyan/35 bg-cyan/10 text-cyan">
                  {index + 1}
                </span>
                {index < activities.length - 1 ? (
                  <span className="absolute top-7 h-full w-px bg-border" />
                ) : null}
              </div>
              <div className="rounded-xl border border-border bg-surface-1/45 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="cyan">{activity.type}</Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
                <div className="mt-2 grid gap-1 font-mono text-[11px] text-muted-foreground">
                  <span>Actor: {activity.actorUserId}</span>
                  {activity.fromUserId ? <span>From: {activity.fromUserId}</span> : null}
                  {activity.toUserId ? <span>To: {activity.toUserId}</span> : null}
                  {activity.message ? (
                    <span className="text-foreground">Message: {activity.message}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ShortcutLink({
  href,
  icon,
  label,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
}) {
  if (!href) {
    return (
      <div className="panel flex items-center justify-between gap-3 p-4 text-muted-foreground opacity-70">
        <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em]">
          {icon}
          {label}
        </span>
        <span className="font-mono text-[10px]">NO URL</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      className="panel flex items-center justify-between gap-3 p-4 text-cyan-ice transition hover:border-cyan/40 hover:bg-cyan/8"
    >
      <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em]">
        {icon}
        {label}
      </span>
      <ExternalLink className="size-4" aria-hidden />
    </a>
  );
}

function PathNode({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/25 p-3">
      <div className="label-mono text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-cyan-ice">{value ?? "-"}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/25 p-3">
      <dt className="label-mono text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-mono text-xs text-cyan-ice">{value ?? "-"}</dd>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "critical" | "cyan" | "green" | "muted";
}) {
  const toneClass = {
    critical: "border-critical/40 bg-critical/10 text-critical",
    cyan: "border-cyan/35 bg-cyan/10 text-cyan-ice",
    green: "border-neon-green/35 bg-neon-green/10 text-neon-green",
    muted: "border-white/10 bg-white/5 text-muted-foreground",
  }[tone];

  return (
    <span className={`label-mono rounded-md border px-2 py-1 text-[10px] ${toneClass}`}>
      {children}
    </span>
  );
}

function StatePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="panel grid min-h-56 place-items-center p-6 text-center">
      <div>
        <AlertTriangle className="mx-auto size-8 text-amber" aria-hidden />
        <h2 className="mt-3 text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-xl font-mono text-xs leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </section>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_520px]" aria-busy="true">
      <div className="grid gap-5">
        <div className="h-44 animate-pulse rounded-2xl border border-border bg-surface-1/45" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface-1/45" />
          <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface-1/45" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-1/45" />
      </div>
      <div className="h-[640px] animate-pulse rounded-2xl border border-border bg-surface-1/45" />
    </div>
  );
}
