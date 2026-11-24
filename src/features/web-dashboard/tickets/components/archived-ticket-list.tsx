'use client';
import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { useTicketPriorities } from '@/hooks/tickets/use-ticket-priorities';
import TicketPriorityIcon from './ticket-priority-icon';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketService } from '@/services/tickets/ticket-service';
import { ticketError } from '@/services/tickets/ticket-operation';
import {
  badgeClass,
  formatDateTime,
  panelClass,
  secondaryButton,
  statusText,
  statusTone,
  ticketPriority,
} from '../lib/ticket-ui';
import TicketEditor from './ticket-editor';
import TicketEvidenceGallery from './ticket-evidence-gallery';
import type { Ticket } from '@/types/ticket';

export default function ArchivedTicketList() {
  const { user } = useAuth();
  const catalog = useTicketPriorities();
  const [restore, setRestore] = useState<Ticket | null>(null);
  const [evidence, setEvidence] = useState<number | null>(null);
  const query = useInfiniteQuery({
    queryKey: ['tickets', 'archived', user?.id],
    queryFn: ({ pageParam }) => ticketService.archived(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section className={panelClass + ' overflow-hidden'}>
      <header className="border-b border-border p-4">
        <h2 className="title-display flex items-center gap-2 text-sm">
          <Trash2 className="size-4 text-critical" aria-hidden />
          Archived Tickets
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Canonical Ticket records and their history are preserved.
        </p>
      </header>
      {!catalog.data?.length && !catalog.isPending && (
        <button
          className="m-4 text-xs text-cyan underline"
          type="button"
          onClick={() => void catalog.refetch()}
        >
          Retry priorities
        </button>
      )}
      {query.isPending ? (
        <p role="status" className="p-5">
          Loading archive...
        </p>
      ) : query.isError ? (
        <p role="alert" className="p-5">
          {ticketError(query.error)}{' '}
          <button className="underline" onClick={() => void query.refetch()}>
            Retry
          </button>
        </p>
      ) : !items.length ? (
        <p className="p-5 text-sm text-muted-foreground">
          No archived Tickets on the loaded pages.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map(({ ticket, archive }) => {
            const priority = ticketPriority(
              ticket.priorityId,
              catalog.data ?? []
            );
            return (
              <li key={ticket.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-cyan">
                      #{ticket.number}
                    </p>
                    <p className="break-words font-semibold">{ticket.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={
                        badgeClass + ' items-center gap-1.5 ' + priority.badge
                      }
                    >
                      <TicketPriorityIcon tone={priority.tone} />
                      {priority.label}
                    </span>
                    <span
                      className={
                        badgeClass + ' ' + statusTone[ticket.state ?? 'CLOSED']
                      }
                    >
                      {statusText(ticket)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Archived {formatDateTime(archive.archived_at)}
                </p>
                <p className="break-words text-sm">{archive.archive_reason}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondaryButton}
                    onClick={() => setRestore(ticket)}
                  >
                    <ArchiveRestore className="size-4" aria-hidden />
                    Restore Ticket
                  </button>
                  <button
                    className={secondaryButton}
                    onClick={() =>
                      setEvidence(evidence === ticket.id ? null : ticket.id)
                    }
                  >
                    {evidence === ticket.id ? 'Hide Evidence' : 'View Evidence'}
                  </button>
                </div>
                {evidence === ticket.id && (
                  <TicketEvidenceGallery
                    ticketId={ticket.id}
                    writable={false}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {query.hasNextPage && (
        <button
          className={'m-4 ' + secondaryButton}
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          Load more archived Tickets
        </button>
      )}
      {restore && (
        <TicketEditor
          action="restore"
          ticket={restore}
          onClose={() => setRestore(null)}
        />
      )}
    </section>
  );
}
