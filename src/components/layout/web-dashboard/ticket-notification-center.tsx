"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CircleAlert, MessageSquareText, TicketCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { useTicketEventNotifications } from "@/hooks/tickets/use-ticket-event-notifications";
import {
  useMyTicketsQuery,
  useTicketsQuery,
} from "@/hooks/tickets/use-ticket-queries";
import { hasAnyRole, hasRole } from "@/lib/auth/auth-permissions";
import {
  buildTicketNotifications,
  type TicketNotification,
  type TicketNotificationTone,
} from "@/features/web-dashboard/tickets/lib/ticket-notifications";
import type { UserProfileResponse } from "@/types/auth";

const MAX_VISIBLE_NOTIFICATIONS = 40;

export function TicketNotificationCenter() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuth();
  const profile = user as UserProfileResponse | null;
  const shouldUseAssignedTickets =
    hasRole(profile, "MAINTENANCE_TECHNICIAN") &&
    !hasAnyRole(profile, ["IT_ADMINISTRATOR", "SYSTEM_MONITORING_OPERATOR"]);
  const allTicketsQuery = useTicketsQuery(undefined, !shouldUseAssignedTickets);
  const assignedTicketsQuery = useMyTicketsQuery(
    undefined,
    shouldUseAssignedTickets,
  );
  const ticketsQuery = shouldUseAssignedTickets
    ? assignedTicketsQuery
    : allTicketsQuery;
  const ticketRoute = shouldUseAssignedTickets ? "/tickets/me" : "/tickets";
  const realtime = useTicketEventNotifications({
    accessToken,
    enabled: isAuthenticated,
    userId: user?.id,
  });
  const snapshotNotifications = useMemo(
    () => buildTicketNotifications(ticketsQuery.data ?? []),
    [ticketsQuery.data],
  );
  const notifications = useMemo(
    () =>
      mergeNotifications([
        ...realtime.notifications,
        ...snapshotNotifications,
      ]),
    [realtime.notifications, snapshotNotifications],
  );
  const storageKey = `ar-imms:ticket-notifications:read:${user?.id ?? "operator"}`;
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      setReadIds(readStoredIds(storageKey));
    }, 0);

    return () => window.clearTimeout(hydrateTimer);
  }, [storageKey]);

  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;

  function persistRead(next: Set<string>) {
    setReadIds(next);
    window.localStorage.setItem(storageKey, JSON.stringify([...next].slice(-200)));
  }

  function markAllRead() {
    persistRead(new Set([...readIds, ...notifications.map((item) => item.id)]));
  }

  function openTicket(item: TicketNotification) {
    persistRead(new Set([...readIds, item.id]));
    window.sessionStorage.setItem("ar-imms:open-ticket", item.ticketId);
    setOpen(false);
    router.push(ticketRoute);
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Ticket notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className="relative grid size-9 place-items-center rounded-lg border border-border bg-surface-1 text-muted-foreground transition hover:border-cyan/40 hover:text-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
        >
          <Bell className="size-4" />
          {unreadCount ? (
            <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-background bg-critical px-1 font-mono text-[8px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-2xl outline-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div>
              <div className="text-sm font-bold text-foreground">Notifications</div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {unreadCount ? `${unreadCount} unread workflow updates` : "You're up to date"}
                {realtime.status === "reconnecting" ? " · reconnecting live feed" : ""}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount ? (
                <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold text-cyan transition hover:bg-cyan/10">
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground" aria-label="Close notifications">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(520px,70vh)] overflow-y-auto p-2">
            {ticketsQuery.isLoading ? (
              <div className="px-3 py-10 text-center text-xs text-muted-foreground">Syncing ticket activity...</div>
            ) : notifications.length ? (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => openTicket(item)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-cyan/5 ${readIds.has(item.id) ? "opacity-65" : "bg-cyan/5"}`}
                >
                  <NotificationIcon tone={item.tone} title={item.title} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-bold text-foreground">{item.title}</span>
                      {!readIds.has(item.id) ? <span className="size-2 shrink-0 rounded-full bg-cyan" /> : null}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] font-semibold text-cyan-ice">{item.ticketCode}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{item.body}</span>
                    <span className="mt-1.5 block font-mono text-[9px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="grid place-items-center gap-2 px-4 py-12 text-center">
                <TicketCheck className="size-7 text-neon-green" />
                <div className="text-sm font-semibold text-foreground">No ticket updates yet</div>
                <div className="text-xs text-muted-foreground">Workflow activity will appear here.</div>
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function NotificationIcon({ tone, title }: { tone: TicketNotificationTone; title: string }) {
  const toneClass = {
    cyan: "bg-cyan/10 text-cyan",
    purple: "bg-purple/10 text-purple",
    amber: "bg-amber/10 text-amber",
    green: "bg-neon-green/10 text-neon-green",
    red: "bg-critical/10 text-critical",
  }[tone];
  const Icon = title.includes("note") ? MessageSquareText : title.includes("review") ? TicketCheck : CircleAlert;
  return <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${toneClass}`}><Icon className="size-4" /></span>;
}

function formatRelativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function mergeNotifications(notifications: TicketNotification[]) {
  const seenIds = new Set<string>();

  return notifications
    .filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    })
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, MAX_VISIBLE_NOTIFICATIONS);
}

function readStoredIds(storageKey: string) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return new Set(stored ? (JSON.parse(stored) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}
