import type {
  TechnicianOption,
  TicketPriority,
  TicketProps,
  TicketStatus,
} from "@/types/ticket";

export const PRIORITY_OPTIONS: Array<TicketPriority | "ALL"> = [
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const STATUS_OPTIONS: Array<TicketStatus | "ALL"> = [
  "ALL",
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_INFO",
  "RESOLVED",
  "CANCELLED",
];

export function priorityTone(priority: TicketPriority): string {
  if (priority === "CRITICAL") {
    return "border-critical/40 bg-critical/10 text-critical";
  }

  if (priority === "HIGH") {
    return "border-amber/40 bg-amber/10 text-amber";
  }

  if (priority === "MEDIUM") {
    return "border-cyan/35 bg-cyan/10 text-cyan-ice";
  }

  return "border-neon-green/35 bg-neon-green/10 text-neon-green";
}

export function statusTone(status: TicketStatus): string {
  if (status === "RESOLVED") {
    return "border-neon-green/35 bg-neon-green/10 text-neon-green";
  }

  if (status === "CLOSED") {
    return "border-white/10 bg-white/5 text-muted-foreground";
  }

  if (status === "CANCELLED") {
    return "border-critical/30 bg-critical/10 text-critical";
  }

  if (status === "WAITING_FOR_INFO") {
    return "border-amber/40 bg-amber/10 text-amber";
  }

  if (status === "OPEN") {
    return "border-cyan/35 bg-cyan/10 text-cyan-ice";
  }

  return "border-purple/40 bg-purple/10 text-purple";
}

export function priorityRailClass(priority: TicketPriority): string {
  if (priority === "CRITICAL") {
    return "bg-critical shadow-[0_0_12px_rgba(255,77,109,0.65)]";
  }

  if (priority === "HIGH") {
    return "bg-amber shadow-[0_0_12px_rgba(255,200,87,0.55)]";
  }

  if (priority === "MEDIUM") {
    return "bg-cyan shadow-[0_0_12px_rgba(0,209,255,0.55)]";
  }

  return "bg-neon-green shadow-[0_0_12px_rgba(0,255,156,0.5)]";
}

export function isActiveTicket(ticket: TicketProps): boolean {
  return !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status);
}

export function getTechnicianName(
  technicianId: string | null | undefined,
  technicians: TechnicianOption[],
): string {
  if (!technicianId) {
    return "Unassigned";
  }

  return (
    technicians.find((technician) => technician.id === technicianId)?.fullName ??
    "Technician assigned"
  );
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeAge(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}
