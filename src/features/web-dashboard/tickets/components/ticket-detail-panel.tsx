"use client";

import {
  AlertCircle,
  Box,
  CheckCircle2,
  ChevronRight,
  FileImage,
  Send,
  Server,
  ShieldCheck,
  Trash2,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/use-auth";
import {
  useAddTicketCommentMutation,
  useAssignTicketMutation,
  useCloseTicketMutation,
  useDeleteTicketMutation,
} from "@/hooks/tickets/use-ticket-mutations";
import {
  useTicketDetailQuery,
  useTicketEvidenceQuery,
} from "@/hooks/tickets/use-ticket-queries";
import type { TechnicianOption, TicketProps } from "@/types/ticket";
import {
  formatDateTime,
  getTechnicianName,
  isActiveTicket,
  priorityTone,
  statusTone,
} from "../lib/ticket-ui";
import TicketConfirmDialog from "./ticket-confirm-dialog";

type TicketDetailPanelProps = {
  ticket: TicketProps;
  tickets: TicketProps[];
  technicians: TechnicianOption[];
  onClose: () => void;
};

type PendingDetailAction =
  | {
      type: "assignment";
      technician: TechnicianOption;
      activeTicketCount: number;
    }
  | {
      type: "close" | "delete";
    }
  | null;

export default function TicketDetailPanel({
  ticket,
  tickets,
  technicians,
  onClose,
}: TicketDetailPanelProps) {
  const { user: currentUser } = useAuth();
  const detailQuery = useTicketDetailQuery(ticket.id);
  const evidenceQuery = useTicketEvidenceQuery(ticket.id);
  const assignMutation = useAssignTicketMutation();
  const commentMutation = useAddTicketCommentMutation();
  const closeMutation = useCloseTicketMutation();
  const deleteMutation = useDeleteTicketMutation();

  const detailTicket = detailQuery.data ?? ticket;
  const [assigneeUserId, setAssigneeUserId] = useState(
    detailTicket.assigneeUserId ?? "",
  );
  const [comment, setComment] = useState("");
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingDetailAction>(null);

  const evidenceItems = useMemo(() => {
    const merged = evidenceQuery.data ?? detailTicket.evidence ?? [];
    return [...merged].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [detailTicket.evidence, evidenceQuery.data]);

  const comments = useMemo(
    () =>
      [...(detailTicket.activities ?? [])]
        .filter((activity) => activity.type === "COMMENT_ADDED")
        .reverse(),
    [detailTicket.activities],
  );

  const activeTicketsForSelectedAssignee = useMemo(() => {
    if (!assigneeUserId) {
      return [];
    }

    return tickets.filter(
      (item) =>
        item.id !== detailTicket.id &&
        item.assigneeUserId === assigneeUserId &&
        isActiveTicket(item),
    );
  }, [assigneeUserId, detailTicket.id, tickets]);

  const selectedTechnician =
    technicians.find((technician) => technician.id === assigneeUserId) ?? null;
  const isTerminal = ["CLOSED", "CANCELLED"].includes(detailTicket.status);
  const isBusy =
    assignMutation.isPending ||
    commentMutation.isPending ||
    closeMutation.isPending ||
    deleteMutation.isPending;

  function requestAssignmentConfirmation() {
    if (!assigneeUserId) {
      toast.error("Select a technician first.");
      return;
    }

    const technician = technicians.find((item) => item.id === assigneeUserId);

    if (!technician) {
      toast.error("Selected technician is not available.");
      return;
    }

    setPendingAction({
      type: "assignment",
      technician,
      activeTicketCount: activeTicketsForSelectedAssignee.length,
    });
  }

  async function performAssign() {
    if (!assigneeUserId) {
      return;
    }

    await assignMutation.mutateAsync({
      ticketId: detailTicket.id,
      payload: { assigneeUserId },
    });
    setPendingAction(null);
  }

  async function handleAddComment() {
    if (!comment.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    await commentMutation.mutateAsync({
      ticketId: detailTicket.id,
      payload: { comment: comment.trim() },
    });
    setComment("");
  }

  async function performCloseTicket() {
    await closeMutation.mutateAsync(detailTicket.id);
    setPendingAction(null);
    onClose();
  }

  async function performDeleteTicket() {
    await deleteMutation.mutateAsync(detailTicket.id);
    setPendingAction(null);
    onClose();
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === "assignment") {
      await performAssign();
      return;
    }

    if (pendingAction.type === "close") {
      await performCloseTicket();
      return;
    }

    await performDeleteTicket();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-background/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-cyan/20 bg-surface-1/95 p-7 shadow-[0_0_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="label-mono text-[10px] text-cyan-ice">
              Ticket Profile
            </div>
            <h2 className="title-display mt-2 truncate text-xl text-foreground">
              {detailTicket.ticketCode}
            </h2>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {detailTicket.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition hover:bg-white/5"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <PanelStat label="Ticket ID" value={detailTicket.id.slice(0, 8)} />
          <PanelStat label="Assignee" value={getTechnicianName(detailTicket.assigneeUserId, technicians)} />
          <PanelStat label="Updated" value={formatDateTime(detailTicket.updatedAt)} />
          <PanelStat label="Evidence" value={String(evidenceItems.length)} tone="text-cyan-ice" />
        </div>

        {detailTicket.assetRef ? (
          <section className="mt-7">
            <div className="label-mono mb-3 text-[10px] text-muted-foreground">Related Asset</div>
            <Link
              href={detailTicket.assetRef.type === "NODE" && detailTicket.assetRef.rackId
                ? `/assets/${detailTicket.assetRef.rackId}/${detailTicket.assetRef.assetId}`
                : detailTicket.assetRef.type === "RACK"
                  ? `/assets/${detailTicket.assetRef.assetId}`
                  : "/assets"}
              className="flex items-center gap-3 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 transition hover:border-cyan/55"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-cyan/25 bg-background/30">
                {detailTicket.assetRef.type === "RACK" ? <Server className="size-5 text-cyan" /> : <Box className="size-5 text-cyan" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="label-mono text-[9px] text-cyan-ice">{detailTicket.assetRef.type} · {detailTicket.assetRef.code}</div>
                <div className="mt-1 truncate text-sm font-semibold text-foreground">{detailTicket.assetRef.displayName}</div>
                {detailTicket.assetRef.type === "NODE" && detailTicket.assetRef.rackCode ? <div className="mt-1 font-mono text-[10px] text-muted-foreground">Located in {detailTicket.assetRef.rackCode}</div> : null}
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </section>
        ) : null}

        <section className="mt-7">
          <div className="label-mono mb-3 text-[10px] text-muted-foreground">
            Workflow State
          </div>
          <div className="grid gap-2">
            <WorkflowStateRow
              label="Lifecycle"
              value={formatStatusLabel(detailTicket.status)}
              helper={statusHelperText(detailTicket.status)}
              className={statusTone(detailTicket.status)}
              icon={<ShieldCheck className="size-4" />}
            />
            <WorkflowStateRow
              label="Priority"
              value={detailTicket.priority}
              helper={priorityHelperText(detailTicket.priority)}
              className={priorityTone(detailTicket.priority)}
              icon={<AlertCircle className="size-4" />}
            />
            <WorkflowStateRow
              label="Acknowledgement"
              value={detailTicket.acknowledgedAt ? "Acknowledged" : "Waiting for technician"}
              helper={
                detailTicket.acknowledgedAt
                  ? `Ack at ${formatDateTime(detailTicket.acknowledgedAt)}`
                  : "Assigned technician has not confirmed receipt yet."
              }
              className={
                detailTicket.acknowledgedAt
                  ? "border-neon-green/35 bg-neon-green/10 text-neon-green"
                  : "border-amber/35 bg-amber/10 text-amber"
              }
              icon={<CheckCircle2 className="size-4" />}
            />
            <WorkflowStateRow
              label="Ticket Lock"
              value={isTerminal ? "Locked" : "Editable"}
              helper={
                isTerminal
                  ? "Terminal ticket: workflow actions are disabled."
                  : "Operator actions are available for this ticket."
              }
              className={
                isTerminal
                  ? "border-white/10 bg-white/5 text-muted-foreground"
                  : "border-cyan/35 bg-cyan/10 text-cyan-ice"
              }
              icon={<Unlock className="size-4" />}
            />
          </div>
        </section>

        <section className="mt-7">
          <div className="label-mono mb-3 text-[10px] text-muted-foreground">
            Assignment
          </div>
          <div className="rounded-2xl border border-border bg-background/25 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-lg border border-cyan/25 bg-cyan/10">
                <UserPlus className="size-4 text-cyan" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {selectedTechnician?.fullName ??
                    getTechnicianName(detailTicket.assigneeUserId, technicians)}
                </div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">
                  {selectedTechnician?.email ?? "Select technician below"}
                </div>
              </div>
            </div>
            <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-border bg-surface-1">
              {technicians.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  No technicians available.
                </div>
              ) : (
                technicians.map((technician) => {
                  const selected = assigneeUserId === technician.id;

                  return (
                    <button
                      key={technician.id}
                      type="button"
                      disabled={isTerminal || isBusy}
                      onClick={() => setAssigneeUserId(technician.id)}
                      className={`w-full border-b border-border/50 px-3 py-3 text-left last:border-b-0 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "bg-cyan/10 text-cyan-ice"
                          : "text-foreground hover:bg-white/5"
                      }`}
                    >
                      <div className="label-mono text-[10px]">
                        {technician.fullName}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {technician.jobTitle ?? technician.username} -{" "}
                        {technician.email}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {activeTicketsForSelectedAssignee.length > 0 ? (
              <div className="mt-3 rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-amber">
                Technician has {activeTicketsForSelectedAssignee.length} active
                ticket(s).
              </div>
            ) : null}
            <button
              type="button"
              onClick={requestAssignmentConfirmation}
              disabled={isTerminal || isBusy || !assigneeUserId}
              className="label-mono mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-cyan/35 bg-cyan/10 px-3 text-[10px] text-cyan-ice transition hover:border-cyan/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="size-3.5" />
              {detailTicket.assigneeUserId ? "Update Assignment" : "Assign Technician"}
            </button>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-border bg-background/25 p-4">
          <div className="label-mono mb-3 text-[10px] text-cyan-ice">
            Quick Actions
          </div>
          <div className="grid gap-2">
            <ActionButton
              label="Confirm Close"
              icon={<CheckCircle2 className="size-4 text-neon-green" />}
              onClick={() => setPendingAction({ type: "close" })}
              disabled={detailTicket.status !== "RESOLVED" || isBusy}
            />
            <ActionButton
              label="Delete Ticket"
              icon={<Trash2 className="size-4 text-critical" />}
              onClick={() => setPendingAction({ type: "delete" })}
              disabled={isBusy || detailTicket.status === "CLOSED"}
              danger
            />
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-background/25">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
            <div>
              <div className="label-mono text-[10px] text-cyan-ice">
                Operator Notes
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Coordinate field work and keep an auditable conversation.
              </p>
            </div>
            <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10 px-2 font-mono text-xs font-semibold text-cyan-ice">
              {comments.length}
            </div>
          </div>

          <div className="p-4">
            <label
              htmlFor={`ticket-comment-${detailTicket.id}`}
              className="mb-2 block text-xs font-semibold text-foreground"
            >
              Add an operator note
            </label>
            <textarea
              id={`ticket-comment-${detailTicket.id}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={isTerminal || isBusy}
              className="block min-h-28 w-full resize-y rounded-xl border border-border bg-surface-1/80 px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-sm placeholder:text-muted-foreground/65 hover:border-cyan/30 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/10 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Share an update, instruction, or follow-up for the technician..."
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] text-muted-foreground">
                {comment.length}/1000
              </span>
              <button
                type="button"
                onClick={handleAddComment}
                disabled={isTerminal || isBusy || !comment.trim()}
                className="label-mono inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan/35 bg-cyan/10 px-4 text-[10px] text-cyan-ice transition hover:border-cyan/60 hover:bg-cyan/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {commentMutation.isPending ? "Posting..." : "Post Note"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border bg-surface-1/35 p-4">
            {comments.length === 0 ? (
              <EmptyBox label="No comments yet." />
            ) : (
              comments.map((activity) => {
                const actor = resolveActorProfile(
                  activity.actorUserId,
                  technicians,
                  currentUser,
                );

                return (
                  <article
                    key={activity.id}
                    className="rounded-xl border border-border bg-background/35 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10 font-mono text-[11px] font-bold text-cyan-ice">
                        {actor.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {actor.name}
                          </span>
                          <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                            {actor.role}
                          </span>
                        </div>
                        <time className="mt-1 block font-mono text-[10px] text-muted-foreground">
                          {formatDateTime(activity.createdAt)}
                        </time>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words border-l-2 border-cyan/25 pl-3 text-sm leading-6 text-foreground/90">
                      {activity.message}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-7">
          <div className="label-mono mb-3 text-[10px] text-muted-foreground">
            Evidence Vault
          </div>
          <div className="grid gap-3">
            {evidenceItems.length === 0 ? (
              <EmptyBox label="No evidence attached." />
            ) : (
              evidenceItems.map((evidence) => {
                const isImage =
                  evidence.url && evidence.mimeType?.startsWith("image/");

                return (
                  <div
                    key={evidence.id}
                    className="overflow-hidden rounded-xl border border-border bg-background/25"
                  >
                    {isImage ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: evidence.url ?? "",
                            title:
                              evidence.fileName ??
                              evidence.storageKey ??
                              evidence.type,
                          })
                        }
                        className="group relative block h-44 w-full overflow-hidden bg-surface-1 text-left"
                        title="View full image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evidence.url}
                          alt={evidence.fileName ?? evidence.type}
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                        />
                        <span className="label-mono absolute bottom-3 right-3 rounded-md border border-cyan/30 bg-background/80 px-2 py-1 text-[9px] text-cyan-ice opacity-0 transition group-hover:opacity-100">
                          View Full
                        </span>
                      </button>
                    ) : (
                      <div className="grid h-24 place-items-center bg-surface-1">
                        <FileImage className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="grid gap-1 p-3">
                      <div className="truncate text-sm text-foreground">
                        {evidence.fileName ??
                          evidence.storageKey ??
                          evidence.type}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        By {resolveActorName(evidence.attachedByUserId, technicians)} -{" "}
                        {formatDateTime(evidence.createdAt)}
                      </div>
                      {evidence.note ? (
                        <div className="text-xs text-muted-foreground">
                          {evidence.note}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </aside>

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-6 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewImage(null);
            }}
            className="absolute right-6 top-6 rounded-lg border border-border bg-surface-1 p-2 text-muted-foreground transition hover:border-cyan/30 hover:text-foreground"
            aria-label="Close image preview"
          >
            <X className="size-5" />
          </button>
          <div
            className="max-h-[88vh] max-w-[92vw]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[82vh] max-w-[92vw] rounded-xl border border-border object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            />
            <div className="mt-3 truncate text-center font-mono text-xs text-muted-foreground">
              {previewImage.title}
            </div>
          </div>
        </div>
      ) : null}

      <TicketConfirmDialog
        open={Boolean(pendingAction)}
        eyebrow={confirmDialogCopy(pendingAction).eyebrow}
        title={confirmDialogCopy(pendingAction).title}
        message={confirmDialogCopy(pendingAction).message}
        confirmLabel={confirmDialogCopy(pendingAction).confirmLabel}
        tone={confirmDialogCopy(pendingAction).tone}
        isPending={
          assignMutation.isPending ||
          closeMutation.isPending ||
          deleteMutation.isPending
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
        detail={
          pendingAction ? (
            <ConfirmDetailSummary
              action={pendingAction}
              ticket={detailTicket}
              currentAssignee={getTechnicianName(
                detailTicket.assigneeUserId,
                technicians,
              )}
            />
          ) : null
        }
      />
    </div>
  );
}

function confirmDialogCopy(action: PendingDetailAction): {
  eyebrow: string;
  title: string;
  message: string;
  confirmLabel: string;
  tone: "cyan" | "green" | "red" | "amber";
} {
  if (action?.type === "assignment") {
    return {
      eyebrow: "// UPDATE ASSIGNMENT",
      title: "Update Technician Assignment",
      message:
        action.activeTicketCount > 0
          ? "The selected technician already has active work. Confirm that this ticket should still be assigned to them."
          : "Confirm the technician assignment for this ticket workflow.",
      confirmLabel: "Update Assignment",
      tone: action.activeTicketCount > 0 ? "amber" : "cyan",
    };
  }

  if (action?.type === "delete") {
    return {
      eyebrow: "// DELETE TICKET",
      title: "Delete Ticket",
      message:
        "Remove this ticket from the active workflow? Use this only for invalid or cancelled work.",
      confirmLabel: "Delete Ticket",
      tone: "red",
    };
  }

  return {
    eyebrow: "// FINAL CONFIRMATION",
    title: "Confirm Ticket Close",
    message:
      "Close this ticket after final operator verification? Closed tickets will no longer appear in the active queue.",
    confirmLabel: "Confirm Close",
    tone: "green",
  };
}

function ConfirmDetailSummary({
  action,
  ticket,
  currentAssignee,
}: {
  action: NonNullable<PendingDetailAction>;
  ticket: TicketProps;
  currentAssignee: string;
}) {
  return (
    <div className="grid gap-3">
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

      {action.type === "assignment" ? (
        <div className="rounded-xl border border-border bg-background/25 p-4">
          <div className="grid gap-2 font-mono text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Current:</span>
              <span className="truncate text-foreground">{currentAssignee}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Next:</span>
              <span className="truncate text-cyan-ice">
                {action.technician.fullName}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Active tickets:</span>
              <span
                className={
                  action.activeTicketCount > 0 ? "text-amber" : "text-neon-green"
                }
              >
                {action.activeTicketCount}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PanelStat({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/25 p-4">
      <div className="label-mono text-[9px] text-muted-foreground">{label}</div>
      <div className={`mt-2 truncate font-mono text-sm font-semibold ${tone}`}>
        {value}
      </div>
    </div>
  );
}

function WorkflowStateRow({
  label,
  value,
  helper,
  className,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr] gap-3 rounded-xl border px-3 py-3 ${className}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="label-mono text-[9px] opacity-75">{label}</span>
          <span className="label-mono truncate text-[10px]">{value}</span>
        </div>
        <div className="mt-1 text-xs leading-5 opacity-75">{helper}</div>
      </div>
    </div>
  );
}

function formatStatusLabel(status: TicketProps["status"]) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusHelperText(status: TicketProps["status"]) {
  switch (status) {
    case "OPEN":
      return "Ticket is open and ready for assignment or triage.";
    case "ASSIGNED":
      return "Technician is assigned; waiting for acknowledgement or progress.";
    case "IN_PROGRESS":
      return "Field work is currently underway.";
    case "WAITING_FOR_INFO":
      return "Work is paused while more information is required.";
    case "RESOLVED":
      return "Technician completed work; operator must confirm close.";
    case "CLOSED":
      return "Ticket has been finally closed.";
    case "CANCELLED":
      return "Ticket was cancelled and can no longer be worked.";
  }
}

function priorityHelperText(priority: TicketProps["priority"]) {
  switch (priority) {
    case "CRITICAL":
      return "Immediate operator attention recommended.";
    case "HIGH":
      return "High impact task; prioritize dispatch.";
    case "MEDIUM":
      return "Standard operational priority.";
    case "LOW":
      return "Low urgency maintenance item.";
  }
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-between rounded-lg border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-critical/35 bg-critical/10 text-critical hover:bg-critical/15"
          : "border-border bg-surface-1 text-foreground hover:border-cyan/35"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronRight className="size-3.5 text-muted-foreground" />
    </button>
  );
}

function EmptyBox({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background/20 px-3 py-5 text-center font-mono text-xs text-muted-foreground">
      {label}
    </div>
  );
}

function resolveActorName(actorUserId: string, technicians: TechnicianOption[]) {
  return (
    technicians.find((technician) => technician.id === actorUserId)?.fullName ??
    actorUserId
  );
}

function resolveActorProfile(
  actorUserId: string,
  technicians: TechnicianOption[],
  currentUser: {
    id?: string;
    fullName?: string;
    username?: string;
    roleCodes?: string[];
  } | null,
) {
  if (currentUser?.id === actorUserId) {
    return {
      name: currentUser.fullName ?? currentUser.username ?? "Operator",
      initials: getInitials(
        currentUser.fullName ?? currentUser.username ?? "Operator",
      ),
      role: formatActorRole(currentUser.roleCodes),
    };
  }

  const technician = technicians.find((item) => item.id === actorUserId);
  if (technician) {
    return {
      name: technician.fullName,
      initials: getInitials(technician.fullName),
      role: technician.jobTitle ?? "Technician",
    };
  }

  return {
    name: "Former or unavailable user",
    initials: "?",
    role: "User unavailable",
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatActorRole(roleCodes?: string[]) {
  if (roleCodes?.includes("SYSTEM_MONITORING_OPERATOR")) return "Operator";
  if (roleCodes?.includes("IT_ADMINISTRATOR")) return "Administrator";
  if (roleCodes?.includes("MAINTENANCE_TECHNICIAN")) return "Technician";
  return "Operator";
}
