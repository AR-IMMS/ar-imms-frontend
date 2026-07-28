import type {
  TicketActivity,
  TicketProps,
  TicketRealtimeEvent,
} from "@/types/ticket";

export type TicketNotificationTone = "cyan" | "purple" | "amber" | "green" | "red";

export interface TicketNotification {
  id: string;
  ticketId: string;
  ticketCode: string;
  title: string;
  body: string;
  createdAt: string;
  tone: TicketNotificationTone;
}

export function buildTicketNotifications(tickets: TicketProps[]): TicketNotification[] {
  return tickets
    .flatMap((ticket) =>
      (ticket.activities ?? []).map((activity) => toNotification(ticket, activity)),
    )
    .filter((item): item is TicketNotification => Boolean(item))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 40);
}

export function toTicketNotificationFromEvent(
  event: TicketRealtimeEvent,
): TicketNotification {
  const common = {
    id: event.id,
    ticketId: event.ticket.id,
    ticketCode: event.ticket.ticketCode,
    createdAt: event.occurredAt,
  };

  switch (event.type) {
    case "ticket.created":
      return {
        ...common,
        title: event.ticket.incidentId ? "Incident ticket created" : "Ticket created",
        body: event.ticket.title,
        tone: event.ticket.priority === "CRITICAL" ? "red" : "cyan",
      };
    case "ticket.assigned":
      return {
        ...common,
        title: "Assignment updated",
        body: event.ticket.assigneeUserId
          ? `Assigned to technician ${event.ticket.assigneeUserId}`
          : event.ticket.title,
        tone: "purple",
      };
    case "ticket.status_changed":
      return {
        ...common,
        title:
          event.ticket.status === "RESOLVED" || event.ticket.status === "CLOSED"
            ? "Ticket ready for review"
            : "Ticket status changed",
        body: `${event.ticket.ticketCode} is now ${formatStatus(event.ticket.status)}`,
        tone:
          event.ticket.status === "RESOLVED" || event.ticket.status === "CLOSED"
            ? "green"
            : "cyan",
      };
    case "ticket.comment_added":
      return {
        ...common,
        title: "New ticket note",
        body: event.ticket.title,
        tone: "amber",
      };
    case "ticket.evidence_attached":
      return {
        ...common,
        title: "Evidence attached",
        body: event.ticket.title,
        tone: "amber",
      };
    case "ticket.deleted":
      return {
        ...common,
        title: "Ticket removed",
        body: event.ticket.title,
        tone: "red",
      };
  }
}

function toNotification(
  ticket: TicketProps,
  activity: TicketActivity,
): TicketNotification | null {
  const common = {
    id: `${ticket.id}:${activity.id}`,
    ticketId: ticket.id,
    ticketCode: ticket.ticketCode,
    createdAt: activity.createdAt,
  };

  switch (activity.type) {
    case "CREATED":
      return {
        ...common,
        title: ticket.incidentId ? "Incident ticket created" : "Ticket created",
        body: ticket.title,
        tone: ticket.priority === "CRITICAL" ? "red" : "cyan",
      };
    case "ASSIGNED":
      return { ...common, title: "Technician assigned", body: activity.message ?? ticket.title, tone: "purple" };
    case "REASSIGNED":
      return { ...common, title: "Assignment updated", body: activity.message ?? ticket.title, tone: "purple" };
    case "ACKNOWLEDGED":
      return { ...common, title: "Ticket acknowledged", body: ticket.title, tone: "cyan" };
    case "COMMENT_ADDED":
      return { ...common, title: "New ticket note", body: activity.message ?? ticket.title, tone: "amber" };
    case "EVIDENCE_ATTACHED":
      return { ...common, title: "Evidence attached", body: activity.message ?? ticket.title, tone: "amber" };
    case "STATUS_CHANGED": {
      const resolved = activity.message?.includes("RESOLVED") || activity.message?.includes("CLOSED");
      return {
        ...common,
        title: resolved ? "Ticket ready for review" : "Ticket status changed",
        body: activity.message ?? ticket.title,
        tone: resolved ? "green" : "cyan",
      };
    }
    default:
      return null;
  }
}

function formatStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}
