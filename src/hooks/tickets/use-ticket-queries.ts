import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ticketService } from "@/services/tickets/ticket-service";
import type { ListTicketsParams } from "@/types/ticket";

const DEFAULT_TICKETS_STALE_TIME = 15_000;
const DEFAULT_TECHNICIANS_STALE_TIME = 60_000;

export function useTicketsQuery(
  params?: ListTicketsParams,
  enabled = true,
  refetchInterval?: number,
) {
  return useQuery({
    queryKey: queryKeys.tickets.list(params),
    queryFn: () => ticketService.listTickets(params),
    enabled,
    staleTime: DEFAULT_TICKETS_STALE_TIME,
    refetchInterval,
    placeholderData: keepPreviousData,
  });
}

export function useTicketDetailQuery(ticketId?: string | null, enabled = true) {
  const normalizedTicketId = ticketId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.tickets.detail(normalizedTicketId),
    queryFn: () => ticketService.getTicket(normalizedTicketId),
    enabled: enabled && normalizedTicketId.length > 0,
    staleTime: DEFAULT_TICKETS_STALE_TIME,
  });
}

export function useTicketEvidenceQuery(
  ticketId?: string | null,
  enabled = true,
) {
  const normalizedTicketId = ticketId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.tickets.evidence(normalizedTicketId),
    queryFn: () => ticketService.listEvidence(normalizedTicketId),
    enabled: enabled && normalizedTicketId.length > 0,
    staleTime: DEFAULT_TICKETS_STALE_TIME,
  });
}
