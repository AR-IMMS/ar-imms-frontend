"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/layout/web-dashboard/header";
import CreateTicketModal from "./components/create-ticket-modal";
import TicketListView from "./ticket-list-view";
import { useTechniciansQuery } from "@/hooks/identity/use-identity-queries";

export default function TicketManagementPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const techniciansQuery = useTechniciansQuery();
  const technicians = techniciansQuery.data ?? [];

  return (
    <div className="ticket-readable h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10">
        <Header
          eyebrow="OPERATOR // TICKET CONTROL"
          title="Ticket Management"
          subtitle="Dispatch, assignment, comments, evidence, and final closure."
          actions={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-electric px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.06em] text-primary-foreground transition hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] sm:w-auto"
            >
              <Plus className="size-3.5" /> Create Ticket
            </button>
          }
        />

        <TicketListView technicians={technicians} />

        {createOpen ? (
          <CreateTicketModal
            technicians={technicians}
            onClose={() => setCreateOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
