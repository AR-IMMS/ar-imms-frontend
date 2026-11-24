'use client';
import Link from 'next/link';
import ArchivedTicketList from './components/archived-ticket-list';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import Header from '@/components/layout/web-dashboard/header';
import CreateTicketModal from './components/create-ticket-modal';
import TicketListView from './ticket-list-view';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketAccess } from '@/lib/auth/ticket-access';
import { primaryButton, secondaryButton } from './lib/ticket-ui';

export default function TicketManagementPage({
  mode = 'all',
}: {
  mode?: 'all' | 'assigned-to-me';
}) {
  const [create, setCreate] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const fromIncident = search.has('incidentId');
  const { user } = useAuth();
  const manager = mode === 'all' && ticketAccess(user).manage;
  const archived = manager && search.get('view') === 'archived';
  const canCreate = mode === 'all' && ticketAccess(user).create;
  return (
    <div className="ticket-readable h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <Header
          eyebrow={
            mode === 'all'
              ? 'Operator // Ticket Control'
              : 'Technician // Assigned Work'
          }
          title={mode === 'all' ? 'Ticket Management' : 'My Tickets'}
          subtitle={
            mode === 'all'
              ? 'Review Tickets, update responsibilities and manage the Ticket lifecycle.'
              : 'Review your assigned or owned Tickets and record internal progress.'
          }
          actions={
            canCreate ? (
              <button
                className={primaryButton + ' w-full sm:w-auto'}
                onClick={() => setCreate(true)}
              >
                <Plus className="size-4" />
                Create Ticket
              </button>
            ) : null
          }
        />
        {fromIncident && (
          <p
            role="status"
            className="rounded-lg border border-amber/35 bg-amber/10 p-3 text-sm"
          >
            Incident-based creation is unavailable. A manual Ticket can still be
            created separately.
          </p>
        )}
        {manager && (
          <nav aria-label="Ticket views" className="flex flex-wrap gap-2">
            <Link
              aria-current={!archived ? 'page' : undefined}
              href="/tickets"
              className={
                secondaryButton +
                (!archived ? ' border-cyan/50 bg-cyan/10' : '')
              }
            >
              Active workspace
            </Link>
            <Link
              aria-current={archived ? 'page' : undefined}
              href="/tickets?view=archived"
              className={
                secondaryButton + (archived ? ' border-cyan/50 bg-cyan/10' : '')
              }
            >
              Archived Tickets
            </Link>
          </nav>
        )}
        {archived ? <ArchivedTicketList /> : <TicketListView mode={mode} />}
        {canCreate && create && (
          <CreateTicketModal
            onClose={() => setCreate(false)}
            onCreated={(id) => router.push('/tickets/' + id)}
          />
        )}
      </div>
    </div>
  );
}
