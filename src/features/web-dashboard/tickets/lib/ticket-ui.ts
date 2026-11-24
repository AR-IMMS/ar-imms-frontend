import type { TicketPriorityMetadata } from '@/services/tickets/ticket-service';
import type { Ticket } from '@/types/ticket';

export const fieldClass =
  'w-full min-w-0 rounded-lg border border-cyan/15 bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:opacity-60';
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:border-cyan/60 hover:bg-cyan/5 focus-visible:outline-2 focus-visible:outline-cyan disabled:opacity-50';
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-electric px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:shadow-[0_0_20px_rgba(0,209,255,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan disabled:opacity-50';
export const panelClass =
  'panel min-w-0 rounded-2xl border border-border bg-surface-1/80';
export const statusTone = {
  NEW: 'border-cyan/35 bg-cyan/10 text-cyan-ice',
  OPEN: 'border-neon-green/30 bg-neon-green/10 text-neon-green',
  PENDING: 'border-amber/35 bg-amber/10 text-amber',
  CLOSED: 'border-border bg-background/50 text-muted-foreground',
};
export const statusText = (ticket: Ticket) =>
  ticket.state ?? 'State #' + ticket.stateId;
export const badgeClass =
  'inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-xs';
const priorityTones = {
  green: {
    badge: 'border-neon-green/30 bg-neon-green/10 text-neon-green',
    rail: 'bg-neon-green',
  },
  neutral: {
    badge: 'border-border bg-background/25 text-muted-foreground',
    rail: 'bg-muted-foreground',
  },
  cyan: {
    badge: 'border-cyan/25 bg-cyan/10 text-cyan-ice',
    rail: 'bg-cyan shadow-[0_0_10px_rgba(0,209,255,0.45)]',
  },
  amber: {
    badge: 'border-amber/30 bg-amber/10 text-amber',
    rail: 'bg-amber shadow-[0_0_10px_rgba(255,177,65,0.45)]',
  },
  critical: {
    badge: 'border-critical/35 bg-critical/10 text-critical',
    rail: 'bg-critical',
  },
};
export function ticketPriority(
  id: number,
  catalog: readonly TicketPriorityMetadata[]
) {
  const found = catalog.find((item) => item.id === id);
  const tone = found?.color ?? 'neutral';
  return {
    label: found?.label ?? 'Unknown priority',
    tone,
    ...priorityTones[tone],
  };
}
export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
