"use client";

import {
  useEffect,
  useDeferredValue,
  useMemo,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCloseTicketMutation,
  useDeleteTicketMutation,
} from "@/hooks/tickets/use-ticket-mutations";
import { useTicketsQuery } from "@/hooks/tickets/use-ticket-queries";
import type {
  TechnicianOption,
  TicketPriority,
  TicketProps,
  TicketStatus,
} from "@/types/ticket";
import TicketConfirmDialog from "./components/ticket-confirm-dialog";
import TicketDetailPanel from "./components/ticket-detail-panel";
import TicketListFilters from "./components/ticket-list-filters";
import {
  formatRelativeAge,
  getTechnicianName,
  priorityRailClass,
  priorityTone,
  statusTone,
} from "./lib/ticket-ui";

type TicketListViewProps = {
  technicians: TechnicianOption[];
};

type AssigneeFilter = "ALL" | "UNASSIGNED" | string;
type PendingListAction =
  | {
      type: "close" | "delete";
      ticket: TicketProps;
    }
  | null;

export default function TicketListView({ technicians }: TicketListViewProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    TicketPriority | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [assigneeFilter, setAssigneeFilter] =
    useState<AssigneeFilter>("ALL");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingListAction>(null);

  useEffect(() => {
    const pendingTicketId = window.sessionStorage.getItem("ar-imms:open-ticket");
    if (!pendingTicketId) return;
    window.sessionStorage.removeItem("ar-imms:open-ticket");
    const timerId = window.setTimeout(
      () => setSelectedTicketId(pendingTicketId),
      0,
    );
    return () => window.clearTimeout(timerId);
  }, []);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const ticketsQuery = useTicketsQuery();
  const closeTicketMutation = useCloseTicketMutation();
  const deleteTicketMutation = useDeleteTicketMutation();

  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);
  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "CLOSED"),
    [tickets],
  );

  const assigneeOptions = useMemo(
    () =>
      technicians.map((technician) => ({
        id: technician.id,
        label: technician.fullName,
      })),
    [technicians],
  );

  const technicianNameById = useMemo(
    () =>
      new Map(
        technicians.map((technician) => [technician.id, technician.fullName]),
      ),
    [technicians],
  );

  const visibleTickets = useMemo(() => {
    return activeTickets.filter((ticket) => {
      if (priorityFilter !== "ALL" && ticket.priority !== priorityFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
        return false;
      }

      if (assigneeFilter === "UNASSIGNED" && ticket.assigneeUserId) {
        return false;
      }

      if (
        assigneeFilter !== "ALL" &&
        assigneeFilter !== "UNASSIGNED" &&
        ticket.assigneeUserId !== assigneeFilter
      ) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const assigneeName = ticket.assigneeUserId
        ? technicianNameById.get(ticket.assigneeUserId)
        : "unassigned";
      const searchable = [
        ticket.ticketCode,
        ticket.title,
        ticket.description,
        ticket.priority,
        ticket.status,
        assigneeName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(deferredSearch);
    });
  }, [
    activeTickets,
    assigneeFilter,
    deferredSearch,
    priorityFilter,
    statusFilter,
    technicianNameById,
  ]);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const stats = useMemo(
    () => ({
      unassigned: activeTickets.filter((ticket) => !ticket.assigneeUserId).length,
      active: activeTickets.filter(
        (ticket) => !["RESOLVED", "CANCELLED"].includes(ticket.status),
      ).length,
      awaitingClose: activeTickets.filter(
        (ticket) => ticket.status === "RESOLVED",
      ).length,
      critical: activeTickets.filter((ticket) => ticket.priority === "CRITICAL")
        .length,
    }),
    [activeTickets],
  );

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === "close") {
      await closeTicketMutation.mutateAsync(pendingAction.ticket.id);
    } else {
      await deleteTicketMutation.mutateAsync(pendingAction.ticket.id);
    }

    setPendingAction(null);
  }

  async function refreshTickets() {
    await ticketsQuery.refetch();
    toast.success("Ticket queue refreshed.");
  }

  return (
    <section className="flex min-w-0 flex-col gap-5" aria-label="Ticket queue">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryStat label="Unassigned" value={stats.unassigned} tone="cyan" />
        <SummaryStat label="Active" value={stats.active} tone="purple" />
        <SummaryStat
          label="Awaiting Close"
          value={stats.awaitingClose}
          tone="green"
        />
        <SummaryStat label="Critical" value={stats.critical} tone="red" />
      </div>

      <TicketListFilters
        search={search}
        priority={priorityFilter}
        status={statusFilter}
        assignee={assigneeFilter}
        assigneeOptions={assigneeOptions}
        onSearchChange={setSearch}
        onPriorityChange={setPriorityFilter}
        onStatusChange={setStatusFilter}
        onAssigneeChange={setAssigneeFilter}
      />

      <div className="panel min-w-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
        <div className="grid grid-cols-12 border-b border-border bg-surface-1/50 px-4 py-3">
          <div className="col-span-4 label-mono text-[10px]">Ticket</div>
          <div className="col-span-2 label-mono text-[10px] text-center">
            Priority
          </div>
          <div className="col-span-2 label-mono text-[10px] text-center">
            Status
          </div>
          <div className="col-span-2 label-mono text-[10px]">Assignee</div>
          <div className="col-span-1 label-mono text-[10px] text-center">
            Updated
          </div>
          <div className="col-span-1 label-mono text-[10px] text-right">
            Actions
          </div>
        </div>

        <div className="min-h-[340px] divide-y divide-border/60">
          {ticketsQuery.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-18 animate-pulse rounded-lg border border-border/60 bg-surface-1/40"
                />
              ))}
            </div>
          ) : ticketsQuery.isError ? (
            <div className="grid min-h-60 place-items-center p-6 text-sm text-muted-foreground">
              Ticket queue could not be loaded.
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="grid min-h-60 place-items-center p-6 text-sm text-muted-foreground">
              No tickets match the current filters.
            </div>
          ) : (
            visibleTickets.map((ticket) => (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTicketId(ticket.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedTicketId(ticket.id);
                  }
                }}
                className="group grid w-full grid-cols-12 items-center px-4 py-3 text-left transition hover:bg-cyan/4"
              >
                <div className="col-span-4 flex min-w-0 items-center gap-3">
                  <span
                    className={`block h-10 w-1.5 shrink-0 rounded-full ${priorityRailClass(ticket.priority)}`}
                  />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs text-cyan">
                        {ticket.ticketCode}
                      </span>
                      {!ticket.assigneeUserId ? (
                        <span className="label-mono rounded border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-[9px] text-amber">
                          UNASSIGNED
                        </span>
                      ) : null}
                      {ticket.assetRef ? (
                        <span className="label-mono max-w-32 truncate rounded border border-cyan/25 bg-cyan/8 px-1.5 py-0.5 text-[9px] text-cyan-ice">
                          {ticket.assetRef.type} · {ticket.assetRef.code}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium text-foreground">
                      {ticket.title}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {ticket.description || "No description recorded."}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex justify-center">
                  <span
                    className={`label-mono rounded-md border px-2 py-1 text-[10px] ${priorityTone(ticket.priority)}`}
                  >
                    {ticket.priority}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center">
                  <span
                    className={`label-mono rounded-md border px-2 py-1 text-[10px] ${statusTone(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <div className="col-span-2 min-w-0">
                  <div className="truncate text-sm text-foreground">
                    {getTechnicianName(ticket.assigneeUserId, technicians)}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {ticket.acknowledgedAt ? "Acknowledged" : "Pending ack"}
                  </div>
                </div>

                <div className="col-span-1 text-center font-mono text-[11px] text-muted-foreground">
                  {formatRelativeAge(ticket.updatedAt)}
                </div>

                <div className="col-span-1 flex justify-end gap-1">
                  {ticket.status === "RESOLVED" ? (
                    <IconAction
                      label="Close"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingAction({ type: "close", ticket });
                      }}
                    >
                      <CheckCircle2 className="size-3.5 text-neon-green" />
                    </IconAction>
                  ) : null}
                  <IconAction
                    label={ticket.assigneeUserId ? "Reassign" : "Assign"}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTicketId(ticket.id);
                    }}
                  >
                    <UserPlus className="size-3.5 text-cyan" />
                  </IconAction>
                  <IconAction
                    label="Delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingAction({ type: "delete", ticket });
                    }}
                  >
                    <Trash2 className="size-3.5 text-critical" />
                  </IconAction>
                  <ChevronRight className="mt-2 size-4 text-muted-foreground group-hover:text-cyan-ice" />
                </div>
              </div>
            ))
          )}
        </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        <span>
          Loaded {visibleTickets.length} of {activeTickets.length} active tickets
        </span>
        <button
          type="button"
          onClick={() => void refreshTickets()}
          disabled={ticketsQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 transition hover:border-cyan/30 hover:text-cyan-ice disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${ticketsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {selectedTicket ? (
        <TicketDetailPanel
          key={selectedTicket.id}
          ticket={selectedTicket}
          tickets={tickets}
          technicians={technicians}
          onClose={() => setSelectedTicketId(null)}
        />
      ) : null}

      <TicketConfirmDialog
        open={Boolean(pendingAction)}
        eyebrow={
          pendingAction?.type === "delete"
            ? "// DELETE TICKET"
            : "// FINAL CONFIRMATION"
        }
        title={
          pendingAction?.type === "delete"
            ? "Delete Ticket"
            : "Confirm Ticket Close"
        }
        message={
          pendingAction?.type === "delete"
            ? `Remove ${pendingAction.ticket.ticketCode} from the active workflow? This action should only be used for invalid or cancelled work.`
            : `Close ${pendingAction?.ticket.ticketCode ?? "this ticket"} after final operator verification? Closed tickets will no longer appear in the active queue.`
        }
        confirmLabel={
          pendingAction?.type === "delete" ? "Delete Ticket" : "Confirm Close"
        }
        tone={pendingAction?.type === "delete" ? "red" : "green"}
        isPending={closeTicketMutation.isPending || deleteTicketMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
        detail={
          pendingAction ? (
            <ConfirmTicketSummary ticket={pendingAction.ticket} />
          ) : null
        }
      />
    </section>
  );
}

function ConfirmTicketSummary({ ticket }: { ticket: TicketProps }) {
  return (
    <div className="rounded-xl border border-border bg-background/25 p-4">
      <div className="font-mono text-xs text-cyan">{ticket.ticketCode}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">
        {ticket.title}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className={`label-mono rounded-md border px-2 py-1 text-[10px] ${priorityTone(ticket.priority)}`}>
          {ticket.priority}
        </span>
        <span className={`label-mono rounded-md border px-2 py-1 text-[10px] ${statusTone(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "green" | "purple" | "red";
}) {
  const toneClass = {
    cyan: "text-cyan",
    green: "text-neon-green",
    purple: "text-purple",
    red: "text-critical",
  }[tone];

  return (
    <div className="panel p-4">
      <div className="label-mono text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-3 font-mono text-3xl font-black ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md border border-border bg-surface-1 transition hover:border-cyan/30 hover:bg-cyan/10"
    >
      {children}
    </button>
  );
}
