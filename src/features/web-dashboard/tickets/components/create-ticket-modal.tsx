"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import ModalLayout from "@/components/layout/modal-layout";
import { useCreateTicketMutation } from "@/hooks/tickets/use-ticket-mutations";
import type { TechnicianOption, TicketAssetReference, TicketPriority } from "@/types/ticket";
import { PRIORITY_OPTIONS, priorityTone } from "../lib/ticket-ui";
import TicketAssetPicker from "./ticket-asset-picker";

type CreateTicketModalProps = {
  technicians: TechnicianOption[];
  onClose: () => void;
};

type FormErrors = {
  ticketCode?: string;
  title?: string;
  apiError?: string;
};

export default function CreateTicketModal({
  technicians,
  onClose,
}: CreateTicketModalProps) {
  const createTicketMutation = useCreateTicketMutation();
  const [ticketCode, setTicketCode] = useState(() => createTicketCode());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("HIGH");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [assetRef, setAssetRef] = useState<TicketAssetReference | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedTechnician = useMemo(
    () =>
      technicians.find((technician) => technician.id === assigneeUserId) ??
      null,
    [assigneeUserId, technicians],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!ticketCode.trim()) {
      nextErrors.ticketCode = "Ticket code is required.";
    }

    if (!title.trim()) {
      nextErrors.title = "Ticket title is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        ticketCode: ticketCode.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeUserId: assigneeUserId || undefined,
        assetRef: assetRef ?? undefined,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : error &&
              typeof error === "object" &&
              "message" in error &&
              typeof error.message === "string"
            ? error.message
          : "Could not create the ticket.";
      setErrors({ apiError: message });
      toast.error(message);
    }
  }

  return (
    <ModalLayout
      onClose={onClose}
      eyebrow="// CREATE TICKET"
      title="Add New Ticket Workflow"
      isPending={createTicketMutation.isPending}
      maxWidth="max-w-6xl"
    >
      <div className="grid max-h-[76vh] flex-1 overflow-y-auto md:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 border-r-0 border-border p-6 md:col-span-7 md:border-r"
        >
          <section className="grid gap-4">
            <div className="label-mono text-[10px] text-cyan-ice">
              Primary Ticket Context
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ticket Code" required error={errors.ticketCode}>
                <input
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  className="ticket-input"
                  placeholder="TCK-WEB-0001"
                />
              </Field>
              <Field label="Priority" required>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITY_OPTIONS.filter((item) => item !== "ALL").map(
                    (nextPriority) => (
                      <button
                        key={nextPriority}
                        type="button"
                        onClick={() => setPriority(nextPriority)}
                        className={`label-mono h-11 rounded-lg border px-3 text-left text-[10px] transition ${
                          priority === nextPriority
                            ? priorityTone(nextPriority)
                            : "border-border bg-surface-1 text-muted-foreground hover:border-cyan/30"
                        }`}
                      >
                        {nextPriority}
                      </button>
                    ),
                  )}
                </div>
              </Field>
            </div>

            <Field label="Title" required error={errors.title}>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="ticket-input"
                placeholder="E.g., Rack thermal threshold breached"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="ticket-input min-h-28 resize-none py-3"
                placeholder="Add operational context, symptoms, or next action..."
              />
            </Field>

            <div className="grid gap-2">
              <div className="label-mono text-[10px] text-muted-foreground">Related Asset <span className="normal-case">(optional)</span></div>
              <TicketAssetPicker value={assetRef} onChange={setAssetRef} />
            </div>
          </section>

          <section className="grid gap-4">
            <div className="label-mono text-[10px] text-cyan-ice">
              Assignment
            </div>
            <div className="rounded-xl border border-border bg-surface-1 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-lg border border-cyan/25 bg-cyan/10">
                  <UserRound className="size-4 text-cyan" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">
                    {selectedTechnician?.fullName ?? "Unassigned"}
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {selectedTechnician?.email ??
                      "Assign later from ticket detail if needed."}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setAssigneeUserId("")}
                  className={`rounded-lg border px-3 py-3 text-left transition ${
                    !assigneeUserId
                      ? "border-cyan/40 bg-cyan/10"
                      : "border-border bg-background/30 hover:border-cyan/25"
                  }`}
                >
                  <div className="label-mono text-[10px] text-foreground">
                    Unassigned
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Create ticket without dispatching a technician.
                  </div>
                </button>
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-background/30">
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
                          onClick={() => setAssigneeUserId(technician.id)}
                          className={`w-full border-b border-border/50 px-3 py-3 text-left last:border-b-0 transition ${
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
              </div>
            </div>
          </section>

          {errors.apiError ? (
            <div className="rounded-md border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
              {errors.apiError}
            </div>
          ) : null}

          <div className="mt-auto flex justify-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createTicketMutation.isPending}
              className="label-mono h-9 rounded-md border border-border bg-transparent px-4 text-[10px] text-muted-foreground transition hover:bg-white/5 hover:text-foreground disabled:opacity-50"
            >
              Cancel Action
            </button>
            <button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="label-mono inline-flex h-9 items-center gap-2 rounded-md bg-electric px-5 text-[10px] font-semibold text-white transition hover:bg-cyan hover:shadow-[0_0_20px_rgba(0,157,255,0.35)] disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {createTicketMutation.isPending
                ? "Creating..."
                : "Create Ticket"}
            </button>
          </div>
        </form>

        <TicketPreview
          ticketCode={ticketCode}
          title={title}
          description={description}
          priority={priority}
          technician={selectedTechnician}
          assetRef={assetRef}
        />
      </div>
    </ModalLayout>
  );
}

function TicketPreview({
  ticketCode,
  title,
  description,
  priority,
  technician,
  assetRef,
}: {
  ticketCode: string;
  title: string;
  description: string;
  priority: TicketPriority;
  technician: TechnicianOption | null;
  assetRef: TicketAssetReference | null;
}) {
  return (
    <aside className="flex flex-col gap-6 p-6 md:col-span-5">
      <div>
        <div className="label-mono text-[10px] text-cyan-ice">
          {"// Workflow Compliance"}
        </div>
        <div className="title-display mt-2 text-base text-foreground">
          Ticket Preview
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-1/50 p-6">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-cyan/20 bg-cyan/10 text-2xl font-black text-cyan">
          {priority.slice(0, 2)}
        </div>
        <div className="mt-5 text-center">
          <div className="title-display text-base text-foreground">
            {title.trim() || "Unspecified Ticket"}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {ticketCode.trim() || "Code Pending"}
          </div>
        </div>

        <div className="my-6 border-t border-border" />

        <PreviewRow label="Priority">
          <span
            className={`label-mono rounded-md border px-2 py-1 text-[10px] ${priorityTone(priority)}`}
          >
            {priority}
          </span>
        </PreviewRow>
        <PreviewRow label="Status">
          <span className="font-mono text-xs text-cyan-ice">OPEN</span>
        </PreviewRow>
        <PreviewRow label="Assignee">
          <span className="truncate font-mono text-xs text-foreground">
            {technician?.fullName ?? "Unassigned"}
          </span>
        </PreviewRow>
        <PreviewRow label="Asset">
          <span className="truncate font-mono text-xs text-foreground">{assetRef ? `${assetRef.type} · ${assetRef.code}` : "Not linked"}</span>
        </PreviewRow>
        <PreviewRow label="Evidence">
          <span className="font-mono text-xs text-muted-foreground">
            Attached later
          </span>
        </PreviewRow>
      </div>

      <div>
        <div className="label-mono mb-3 text-[10px] text-muted-foreground">
          Dispatch Readiness
        </div>
        <div className="grid gap-2">
          <ReadinessItem
            ready={Boolean(title.trim())}
            label="Operational title provided"
          />
          <ReadinessItem
            ready={Boolean(description.trim())}
            label="Field context available"
          />
          <ReadinessItem
            ready={Boolean(technician)}
            label="Technician preassigned"
            optional
          />
          <ReadinessItem ready={Boolean(assetRef)} label="Rack or node linked" optional />
        </div>
      </div>
    </aside>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="label-mono text-[10px] text-muted-foreground">
        {label}
        {required ? <span className="text-critical"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-critical">{error}</span> : null}
    </label>
  );
}

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="label-mono text-[10px] text-muted-foreground">
        {label}:
      </span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function ReadinessItem({
  ready,
  label,
  optional,
}: {
  ready: boolean;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2">
      {ready ? (
        <CheckCircle2 className="size-3.5 text-neon-green" />
      ) : optional ? (
        <ShieldCheck className="size-3.5 text-muted-foreground" />
      ) : (
        <AlertTriangle className="size-3.5 text-amber" />
      )}
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function createTicketCode() {
  return `TCK-WEB-${Date.now().toString().slice(-5)}`;
}
