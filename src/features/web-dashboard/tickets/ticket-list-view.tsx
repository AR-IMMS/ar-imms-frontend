'use client';
import { useTicketPriorities } from '@/hooks/tickets/use-ticket-priorities';
import TicketPriorityIcon from './components/ticket-priority-icon';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Eye,
  Inbox,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/auth/use-auth';
import {
  useTicketDetailQuery,
  useTicketLinksQuery,
  useTicketsQuery,
} from '@/hooks/tickets/use-ticket-queries';
import { ticketError } from '@/services/tickets/ticket-operation';
import type { ListTicketsParams, Ticket } from '@/types/ticket';
import TicketListFilters from './components/ticket-list-filters';
import TicketConfirmDialog from './components/ticket-confirm-dialog';
import TicketAssetCards from './components/ticket-asset-cards';
import {
  badgeClass,
  formatDateTime,
  panelClass,
  secondaryButton,
  statusText,
  statusTone,
  ticketPriority,
} from './lib/ticket-ui';

const iconButton =
  'inline-grid size-8 place-items-center rounded-lg border border-border text-cyan-ice transition hover:border-cyan/60 hover:bg-cyan/10 focus-visible:outline-2 focus-visible:outline-cyan';

function TicketBadges({ ticket }: { ticket: Ticket }) {
  const priority = ticketPriority(
    ticket.priorityId,
    useTicketPriorities().data ?? []
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        title={'Priority ID: ' + ticket.priorityId}
        className={badgeClass + ' items-center gap-1.5 ' + priority.badge}
      >
        <TicketPriorityIcon tone={priority.tone} />
        {priority.label}
      </span>
      <span className={badgeClass + ' ' + statusTone[ticket.state ?? 'CLOSED']}>
        {statusText(ticket)}
      </span>
    </div>
  );
}
function TicketQuickView({ id, onClose }: { id: number; onClose: () => void }) {
  const detail = useTicketDetailQuery(id);
  const links = useTicketLinksQuery(id, detail.isSuccess);
  return (
    <TicketConfirmDialog
      title="Ticket overview"
      pending={false}
      onClose={onClose}
      drawer
    >
      <div className="space-y-6 p-6">
        {detail.isPending ? (
          <p role="status">Loading Ticket...</p>
        ) : detail.isError ? (
          <p role="alert">{ticketError(detail.error)}</p>
        ) : (
          <>
            <div>
              <p className="label-mono text-cyan">#{detail.data.number}</p>
              <h3 className="mb-3 mt-1 break-words text-xl font-semibold">
                {detail.data.title}
              </h3>
              <TicketBadges ticket={detail.data} />
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-4" aria-hidden />
              Updated {formatDateTime(detail.data.updatedAt)}
            </p>
            <section className={panelClass + ' space-y-3 p-4'}>
              <h3 className="title-display text-sm">Related Assets</h3>
              {links.isPending ? (
                <p role="status">Loading links...</p>
              ) : links.isError ? (
                <p role="alert">{ticketError(links.error)}</p>
              ) : (
                <TicketAssetCards ids={links.data.assetIds} />
              )}
            </section>
            <Link
              href={'/tickets/' + id}
              onClick={onClose}
              className={secondaryButton}
            >
              <ArrowUpRight className="size-4" aria-hidden />
              Open full Ticket
            </Link>
          </>
        )}
      </div>
    </TicketConfirmDialog>
  );
}

export default function TicketListView({
  mode,
}: {
  mode: 'all' | 'assigned-to-me';
}) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ListTicketsParams>({});
  const [scope, setScope] = useState<'assigned' | 'owner'>('assigned');
  const [preview, setPreview] = useState<number | null>(null);
  const mine = mode === 'assigned-to-me';
  const criteria: ListTicketsParams = mine
    ? scope === 'owner'
      ? { ...filters, business_owner_user_id: user?.id }
      : { ...filters, assignee_user_id: user?.id }
    : filters;
  const catalog = useTicketPriorities();
  const query = useTicketsQuery(criteria);
  const tickets = query.data?.pages.flatMap((page) => page.items) ?? [];
  const responsibility = mine
    ? scope === 'owner'
      ? 'Owned by you'
      : 'Assigned to you'
    : filters.business_owner_user_id && filters.assignee_user_id
      ? 'Owner and Assignee match filters'
      : filters.business_owner_user_id
        ? 'Owner matches filter'
        : filters.assignee_user_id
          ? 'Assignee matches filter'
          : null;
  const stats = [
    {
      label: 'Loaded',
      count: tickets.length,
      color: 'text-cyan',
      icon: Layers,
    },
    {
      label: 'New',
      count: tickets.filter((item) => item.state === 'NEW').length,
      color: 'text-purple',
      icon: Inbox,
    },
    {
      label: 'Open',
      count: tickets.filter((item) => item.state === 'OPEN').length,
      color: 'text-neon-green',
      icon: Activity,
    },
    {
      label: 'Pending',
      count: tickets.filter((item) => item.state === 'PENDING').length,
      color: 'text-amber',
      icon: Clock3,
    },
  ];
  return (
    <section aria-label="Ticket queue" className="flex min-w-0 flex-col gap-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="label-mono text-[10px] text-muted-foreground">
            Loaded results only
          </p>
          {mine && (
            <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              My responsibility
              <select
                className={secondaryButton}
                value={scope}
                onChange={(event) => {
                  setFilters((value) => ({
                    ...value,
                    business_owner_user_id: undefined,
                  }));
                  setScope(
                    event.target.value === 'owner' ? 'owner' : 'assigned'
                  );
                }}
              >
                <option value="assigned">Assigned to me</option>
                <option value="owner">Owned by me</option>
              </select>
            </label>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map(({ label, count, color, icon: Icon }) => (
            <div
              key={label}
              className={
                panelClass +
                ' relative overflow-hidden bg-gradient-to-br from-surface-2/70 to-surface-1/55 p-3 sm:p-4'
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="label-mono text-[10px] text-muted-foreground">
                  {label}
                </span>
                <Icon className={'size-4 ' + color} aria-hidden />
              </div>
              <div
                className={
                  'mt-2 font-mono text-2xl font-bold tabular-nums ' + color
                }
              >
                {query.isSuccess &&
                (label === 'Loaded' || tickets.every((item) => item.state))
                  ? count
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <TicketListFilters
        key={scope}
        filters={filters}
        onChange={setFilters}
        showAssignee={!mine}
        showOwner={!mine}
      />
      <div className={panelClass + ' min-h-[16rem] overflow-hidden'}>
        {query.isPending ? (
          <div role="status" className="space-y-3 p-4">
            <span className="sr-only">Loading Tickets</span>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-16 animate-pulse rounded-lg border border-border/60 bg-background/60"
              />
            ))}
          </div>
        ) : query.isError ? (
          <div role="alert" className="p-5">
            <p>{ticketError(query.error)}</p>
            <button
              className={'mt-3 ' + secondaryButton}
              onClick={() => void query.refetch()}
            >
              Retry
            </button>
          </div>
        ) : !tickets.length ? (
          <div className="grid justify-items-center p-8 text-center">
            <Inbox className="mb-2 size-6 text-cyan-ice" aria-hidden />
            <h2 className="font-semibold">No Tickets found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try changing the filters or refreshing the list.
            </p>
          </div>
        ) : (
          <>
            <div
              aria-hidden
              className="label-mono hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem] gap-4 border-b border-border bg-surface-2/45 px-5 py-3 text-[10px] text-muted-foreground lg:grid"
            >
              <span>Ticket</span>
              <span>Priority / State</span>
              <span>Context / Updated</span>
              <span className="text-right">Actions</span>
            </div>
            <ul aria-label="Tickets" className="divide-y divide-border/70">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 px-3 py-4 transition hover:bg-cyan/5 sm:px-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_5.5rem] lg:gap-4"
                >
                  <div className="flex min-w-0 items-stretch gap-3">
                    <span
                      aria-hidden
                      className={
                        'my-1 w-1 shrink-0 rounded-full ' +
                        ticketPriority(ticket.priorityId, catalog.data ?? [])
                          .rail
                      }
                    />
                    <Link
                      href={'/tickets/' + ticket.id}
                      className="block min-w-0 rounded focus-visible:outline-2 focus-visible:outline-cyan"
                    >
                      <span className="block font-mono text-xs text-cyan">
                        #{ticket.number}
                      </span>
                      <span className="block break-words text-sm font-semibold group-hover:text-cyan-ice">
                        {ticket.title}
                      </span>
                    </Link>
                  </div>
                  <div className="col-start-1 row-start-2 lg:col-start-auto lg:row-start-auto">
                    <TicketBadges ticket={ticket} />
                  </div>
                  <div className="col-start-1 row-start-3 min-w-0 text-xs lg:col-start-auto lg:row-start-auto">
                    {responsibility && (
                      <p className="mb-1 font-medium text-cyan-ice">
                        {responsibility}
                      </p>
                    )}
                    <time
                      dateTime={ticket.updatedAt}
                      className="font-mono text-muted-foreground"
                    >
                      {formatDateTime(ticket.updatedAt)}
                    </time>
                  </div>
                  <div className="col-start-2 row-start-1 flex flex-wrap justify-end gap-1.5 lg:col-start-auto lg:row-start-auto">
                    <button
                      type="button"
                      aria-label={'Quick view Ticket ' + ticket.number}
                      title="Quick view"
                      className={iconButton}
                      onClick={() => setPreview(ticket.id)}
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
                    <Link
                      href={'/tickets/' + ticket.id}
                      aria-label={'Open Ticket ' + ticket.number}
                      title="Open Ticket"
                      className={iconButton}
                    >
                      <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {query.isSuccess ? String(tickets.length) + ' loaded' : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {query.hasNextPage && (
            <button
              className={secondaryButton}
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          )}
          <button
            className={secondaryButton}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden />
            Refresh
          </button>
        </div>
      </div>
      {preview !== null && (
        <TicketQuickView id={preview} onClose={() => setPreview(null)} />
      )}
    </section>
  );
}
