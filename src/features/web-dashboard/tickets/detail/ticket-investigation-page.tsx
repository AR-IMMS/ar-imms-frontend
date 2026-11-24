'use client';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useTicketDetailQuery } from '@/hooks/tickets/use-ticket-queries';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketHome } from '@/lib/auth/ticket-access';
import { errorInfo, ticketError } from '@/services/tickets/ticket-operation';
import Header from '@/components/layout/web-dashboard/header';
import TicketDetailPanel from '../components/ticket-detail-panel';
import { secondaryButton } from '../lib/ticket-ui';

export default function TicketInvestigationPage({
  ticketId,
}: {
  ticketId: string;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const home = ticketHome(user) ?? '/tickets';
  const id = Number(ticketId);
  const valid = /^[1-9][0-9]*$/.test(ticketId) && Number.isSafeInteger(id);
  const detail = useTicketDetailQuery(id, valid);
  const status = errorInfo(detail.error).status;
  return (
    <div className="ticket-readable h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <Header
          eyebrow="Ticket Management"
          title="Ticket Detail"
          actions={
            <>
              <Link className={secondaryButton} href={home}>
                Back to Tickets
              </Link>
              {valid && (
                <button
                  className={secondaryButton}
                  disabled={detail.isFetching}
                  onClick={() =>
                    void cache.invalidateQueries({
                      queryKey: queryKeys.tickets.all,
                    })
                  }
                >
                  Refresh Ticket
                </button>
              )}
            </>
          }
        />
        {!valid ? (
          <p role="alert">Ticket not found or no longer accessible.</p>
        ) : detail.isPending ? (
          <div
            role="status"
            className="panel h-40 animate-pulse rounded-2xl p-5"
          >
            Loading Ticket?
          </div>
        ) : detail.isError ? (
          <div role="alert" className="panel rounded-2xl p-5">
            <p>{ticketError(detail.error)}</p>
            {status !== 404 && status !== 403 && (
              <button
                className={'mt-3 ' + secondaryButton}
                onClick={() => void detail.refetch()}
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <TicketDetailPanel ticket={detail.data} />
        )}
      </div>
    </div>
  );
}
