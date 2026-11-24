'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketService } from '@/services/tickets/ticket-service';

export function useTicketPriorities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tickets', 'priorities', user?.id],
    queryFn: ticketService.priorities,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}
