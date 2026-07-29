"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { toTicketNotificationFromEvent } from "@/features/web-dashboard/tickets/lib/ticket-notifications";
import { TICKET_ENDPOINTS } from "@/lib/react-query/api-endpoint";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { TicketNotification } from "@/features/web-dashboard/tickets/lib/ticket-notifications";
import type {
  TicketPriority,
  TicketRealtimeEvent,
  TicketRealtimeEventType,
  TicketStatus,
} from "@/types/ticket";

const INCIDENT_API_URL =
  process.env.NEXT_PUBLIC_INCIDENT_WORKFLOW_API_URL ??
  process.env.NEXT_PUBLIC_INCIDENT_API_URL ??
  "";
const MAX_REALTIME_NOTIFICATIONS = 40;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;
const AUTH_REJECTION_STATUSES = new Set([401, 403]);
const TICKET_EVENT_TYPES: ReadonlySet<string> = new Set([
  "ticket.created",
  "ticket.assigned",
  "ticket.status_changed",
  "ticket.deleted",
  "ticket.comment_added",
  "ticket.evidence_attached",
]);
const TICKET_PRIORITIES: ReadonlySet<string> = new Set([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
const TICKET_STATUSES: ReadonlySet<string> = new Set([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_INFO",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

export type TicketEventStreamStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unauthorized"
  | "unavailable";

interface UseTicketEventNotificationsInput {
  accessToken?: string | null;
  userId?: string | null;
  enabled: boolean;
}

export function useTicketEventNotifications({
  accessToken,
  userId,
  enabled,
}: UseTicketEventNotificationsInput) {
  const queryClient = useQueryClient();
  const [streamStatus, setStreamStatus] =
    useState<TicketEventStreamStatus>("idle");
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const storageKey = useMemo(
    () => `ar-imms:ticket-notifications:events:${userId ?? "anonymous"}`,
    [userId],
  );
  const status = enabled && accessToken ? streamStatus : "idle";

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      setNotifications(readStoredNotifications(storageKey));
    }, 0);

    return () => window.clearTimeout(hydrateTimer);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    const abortController = new AbortController();
    let retryDelayMs = INITIAL_RETRY_DELAY_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      setStreamStatus((current) =>
        current === "connected" ? "connected" : "connecting",
      );

      try {
        const response = await fetch(buildTicketEventsUrl(), {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${accessToken}`,
          },
          signal: abortController.signal,
        });

        if (AUTH_REJECTION_STATUSES.has(response.status)) {
          setStreamStatus("unauthorized");
          return;
        }

        if (!response.ok || !response.body) {
          throw new Error(`Ticket event stream failed: ${response.status}`);
        }

        setStreamStatus("connected");
        retryDelayMs = INITIAL_RETRY_DELAY_MS;
        await readTicketEventStream(response.body, abortController.signal, (event) => {
          handleTicketEvent(event);
        });

        if (!abortController.signal.aborted) {
          scheduleReconnect();
        }
      } catch {
        if (!abortController.signal.aborted) {
          scheduleReconnect();
        }
      }
    };

    const handleTicketEvent = (event: TicketRealtimeEvent) => {
      const notification = toTicketNotificationFromEvent(event);
      setNotifications((current) =>
        persistRealtimeNotification(storageKey, current, notification),
      );

      void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(event.ticket.id),
      });

      if (event.type === "ticket.evidence_attached") {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tickets.evidence(event.ticket.id),
        });
      }
    };

    const scheduleReconnect = () => {
      setStreamStatus("reconnecting");
      retryTimer = setTimeout(() => {
        retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
        void connect();
      }, retryDelayMs);
    };

    void connect();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      abortController.abort();
    };
  }, [accessToken, enabled, queryClient, storageKey]);

  return { notifications, status };
}

export function parseTicketRealtimeEvent(value: unknown): TicketRealtimeEvent | null {
  if (!isRecord(value)) return null;
  if (!isTicketEventType(value.type)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.occurredAt !== "string") return null;
  if (!isRecord(value.ticket)) return null;
  if (typeof value.ticket.id !== "string") return null;
  if (typeof value.ticket.ticketCode !== "string") return null;
  if (typeof value.ticket.title !== "string") return null;
  if (!isTicketPriority(value.ticket.priority)) return null;
  if (!isTicketStatus(value.ticket.status)) return null;

  return {
    id: value.id,
    type: value.type,
    occurredAt: value.occurredAt,
    ticket: {
      id: value.ticket.id,
      ticketCode: value.ticket.ticketCode,
      title: value.ticket.title,
      priority: value.ticket.priority,
      status: value.ticket.status,
      incidentId:
        typeof value.ticket.incidentId === "string"
          ? value.ticket.incidentId
          : null,
      assigneeUserId:
        typeof value.ticket.assigneeUserId === "string"
          ? value.ticket.assigneeUserId
          : null,
    },
    actorUserId:
      typeof value.actorUserId === "string" ? value.actorUserId : undefined,
  };
}

export function parseTicketEventFrame(frame: string): TicketRealtimeEvent | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return null;

  try {
    return parseTicketRealtimeEvent(JSON.parse(data));
  } catch {
    return null;
  }
}

async function readTicketEventStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (event: TicketRealtimeEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const event = parseTicketEventFrame(frame);
        if (event) {
          onEvent(event);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function buildTicketEventsUrl() {
  return `${INCIDENT_API_URL}${TICKET_ENDPOINTS.EVENTS}`;
}

function persistRealtimeNotification(
  storageKey: string,
  current: TicketNotification[],
  notification: TicketNotification,
) {
  if (current.some((item) => item.id === notification.id)) {
    return current;
  }

  const next = [notification, ...current]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, MAX_REALTIME_NOTIFICATIONS);

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {}

  return next;
}

function readStoredNotifications(storageKey: string) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTicketNotification).slice(0, MAX_REALTIME_NOTIFICATIONS);
  } catch {
    return [];
  }
}

function isTicketNotification(value: unknown): value is TicketNotification {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.ticketId === "string" &&
    typeof value.ticketCode === "string" &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.tone === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTicketEventType(value: unknown): value is TicketRealtimeEventType {
  return typeof value === "string" && TICKET_EVENT_TYPES.has(value);
}

function isTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === "string" && TICKET_PRIORITIES.has(value);
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && TICKET_STATUSES.has(value);
}
