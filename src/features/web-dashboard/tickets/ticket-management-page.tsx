"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/layout/web-dashboard/header";
import { useTechniciansQuery } from "@/hooks/tickets/use-ticket-queries";
import CreateTicketModal from "./components/create-ticket-modal";
import TicketListView from "./ticket-list-view";

export default function TicketManagementPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const techniciansQuery = useTechniciansQuery();
  const technicians = techniciansQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Header
        eyebrow="OPERATOR // TICKET CONTROL"
        title="Ticket Management"
        subtitle="Dispatch, assignment, comments, evidence, and final closure."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg px-3 py-2 text-xs label-mono bg-gradient-to-r from-cyan to-electric text-primary-foreground hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition inline-flex items-center gap-2"
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
  );
}
