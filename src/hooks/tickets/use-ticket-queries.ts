import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ticketService } from '@/services/tickets/ticket-service';
import type { ListTicketsParams, Ticket } from '@/types/ticket';
import { useAuth } from '@/hooks/auth/use-auth';
import { queryKeys } from '@/lib/react-query/query-keys';

export function useTicketsQuery(params: ListTicketsParams, enabled = true) {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: queryKeys.tickets.list(user?.id, params),
    queryFn: ({ pageParam }) => ticketService.list(params, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: enabled && Boolean(user?.id),
  });
}
export function useTicketDetailQuery(id: number, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.tickets.detail(user?.id, id),
    queryFn: () => ticketService.get(id),
    refetchOnWindowFocus: 'always',
    enabled: enabled && Boolean(user?.id),
  });
}
export function useTicketArticlesQuery(id: number, enabled = true) {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: queryKeys.tickets.articles(user?.id, id),
    queryFn: ({ pageParam }) => ticketService.articles(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: enabled && Boolean(user?.id),
  });
}
export function useTicketLinksQuery(id: number, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.tickets.links(user?.id, id),
    queryFn: () => ticketService.links(id),
    enabled: enabled && Boolean(user?.id),
  });
}
export function useTicketOwnerQuery(
  ticket: Ticket | undefined,
  enabled: boolean
) {
  const { user } = useAuth();
  const actorId = user?.id ?? '';
  return useQuery({
    queryKey: queryKeys.tickets.owner(
      actorId,
      ticket?.id ?? 0,
      ticket?.updatedAt
    ),
    queryFn: () =>
      ticket ? ticketService.verifyOwner(ticket, actorId) : false,
    enabled: enabled && Boolean(ticket) && Boolean(actorId),
    retry: false,
    refetchOnWindowFocus: 'always',
  });
}
