'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketHome } from '@/lib/auth/ticket-access';
import { ticketService } from '@/services/tickets/ticket-service';

export function TicketNotificationCenter() {
  const { user } = useAuth();
  const home = ticketHome(user);
  const cache = useQueryClient();
  const scope = ['tickets', 'notifications', user?.id] as const;
  const inbox = useQuery({
    queryKey: scope,
    queryFn: ticketService.notifications,
    enabled: Boolean(home && user?.id),
    refetchInterval: 60_000,
    refetchOnWindowFocus: 'always',
    retry: false,
  });
  const mark = useMutation({
    mutationFn: ticketService.markNotificationsRead,
    onSettled: () => cache.invalidateQueries({ queryKey: scope }),
  });
  const data = inbox.isError ? undefined : inbox.data;
  const unread = data?.unreadCount ?? 0;

  if (!home) return null;

  return (
    <details
      className="relative"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          mark.reset();
          void inbox.refetch();
        }
      }}
    >
      <summary
        aria-label={
          unread
            ? `Ticket notifications, ${unread} unread`
            : 'Ticket notifications'
        }
        title="Ticket notifications"
        className="relative flex h-9 min-w-9 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-border px-2 text-foreground hover:text-cyan focus-visible:outline-2 focus-visible:outline-cyan sm:px-3"
      >
        <Bell aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden text-xs font-semibold sm:inline">
          Notifications
        </span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-cyan px-1 text-[10px] font-bold text-slate-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </summary>
      <div className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface-1 text-sm shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border p-3">
          <div>
            <h2 className="font-semibold">Ticket notifications</h2>
            {data && (
              <p className="text-xs text-muted-foreground">{unread} unread</p>
            )}
          </div>
          <button
            type="button"
            disabled={!unread || mark.isPending}
            onClick={() =>
              mark.mutate(
                data?.items
                  .filter((item) => !item.read)
                  .map((item) => item.id) ?? []
              )
            }
            className="text-xs font-semibold text-cyan disabled:opacity-50"
          >
            Mark shown read
          </button>
        </div>
        {inbox.isPending ? (
          <p role="status" className="p-4 text-muted-foreground">
            Loading notifications...
          </p>
        ) : null}
        {inbox.isError ? (
          <p role="alert" className="p-4 text-muted-foreground">
            Could not load notifications.{' '}
            <button
              type="button"
              onClick={() => void inbox.refetch()}
              className="text-cyan underline"
            >
              Retry
            </button>
          </p>
        ) : null}
        {mark.isError ? (
          <p role="alert" className="px-4 py-2 text-muted-foreground">
            Could not mark notifications as read.
          </p>
        ) : null}
        {data && !data.items.length && (
          <div className="space-y-1 p-4 text-muted-foreground">
            <p className="font-medium text-foreground">
              No notifications for your account yet.
            </p>
            <p className="text-xs leading-relaxed">
              Updates from other people on Tickets you own or are assigned to
              appear here.
            </p>
          </div>
        )}
        <ul className="max-h-96 divide-y divide-border overflow-y-auto">
          {data?.items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/tickets/${item.ticket_id}`}
                onClick={(event) => {
                  if (!item.read) mark.mutate([item.id]);
                  const panel = event.currentTarget.closest('details');
                  if (panel) panel.open = false;
                }}
                className="flex items-start gap-3 p-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-cyan"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-cyan'}`}
                  aria-label={item.read ? 'Read' : 'Unread'}
                />
                <div className="min-w-0">
                  <p className="font-semibold">{item.label}</p>
                  <p className="truncate text-muted-foreground">
                    #{item.ticket_number} {'\u00b7'} {item.ticket_title}
                  </p>
                  <time
                    dateTime={item.occurred_at}
                    className="text-xs text-muted-foreground"
                  >
                    {new Date(item.occurred_at).toLocaleString()}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
