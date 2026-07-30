"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/layout/web-dashboard/header";
import CreateTicketModal from "./components/create-ticket-modal";
import TicketListView from "./ticket-list-view";
import { useTechniciansQuery } from "@/hooks/identity/use-identity-queries";

type TicketManagementPageProps = {
  mode?: "all" | "assigned-to-me";
};

const PAGE_COPY = {
  all: {
    eyebrow: "OPERATOR // TICKET CONTROL",
    title: "Ticket Management",
    subtitle: "Dispatch, assignment, comments, evidence, and final closure.",
  },
  "assigned-to-me": {
    eyebrow: "TECHNICIAN // ASSIGNED WORK",
    title: "My Tickets",
    subtitle: "Review assigned work, acknowledge dispatch, and update progress.",
  },
} as const;

export default function TicketManagementPage({
  mode = "all",
}: TicketManagementPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const copy = PAGE_COPY[mode];
  const canCreateTickets = mode === "all";
  const techniciansQuery = useTechniciansQuery(canCreateTickets);
  const technicians = canCreateTickets ? (techniciansQuery.data ?? []) : [];

  return (
    <div className="ticket-readable h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10">
        <Header
          eyebrow={copy.eyebrow}
          title={copy.title}
          subtitle={copy.subtitle}
          actions={
            canCreateTickets ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-electric px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.06em] text-primary-foreground transition hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] sm:w-auto"
              >
                <Plus className="size-3.5" /> Create Ticket
              </button>
            ) : null
          }
        />

        <TicketListView technicians={technicians} mode={mode} />

        {canCreateTickets && createOpen ? (
          <CreateTicketModal
            technicians={technicians}
            onClose={() => setCreateOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
