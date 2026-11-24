'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth/use-auth';
import { useCurrentUser } from '@/hooks/auth/use-auth-query';
import { ticketAccess } from '@/lib/auth/ticket-access';
import { ticketError } from '@/services/tickets/ticket-operation';

function TicketGuard({
  children,
  operatorOnly = false,
}: {
  children: ReactNode;
  operatorOnly?: boolean;
}) {
  const { hasHydrated, isAuthenticated, user } = useAuth();
  const profile = useCurrentUser(hasHydrated && isAuthenticated);
  if (!hasHydrated || profile.isLoading)
    return (
      <p role="status" className="p-8 text-muted-foreground">
        Loading Ticket access?
      </p>
    );
  if (profile.isError)
    return (
      <div role="alert" className="p-8">
        {ticketError(profile.error)}{' '}
        <button className="underline" onClick={() => void profile.refetch()}>
          Retry
        </button>
      </div>
    );
  const access = ticketAccess(user);
  if (!access.read)
    return (
      <div role="alert" className="p-8">
        <h1 className="text-xl font-semibold">Ticket access denied</h1>
        <p className="mt-2 text-muted-foreground">
          Ticket access requires an authorized Operator or Technician.
        </p>
      </div>
    );
  if (operatorOnly && !access.operator)
    return (
      <p className="p-8">
        <Link className="text-cyan underline" href="/tickets/me">
          Open My Tickets
        </Link>
      </p>
    );
  return children;
}
export function OperatorTicketRouteGuard({
  children,
}: {
  children: ReactNode;
}) {
  return <TicketGuard operatorOnly>{children}</TicketGuard>;
}
export function AssignedTicketRouteGuard({
  children,
}: {
  children: ReactNode;
}) {
  return <TicketGuard>{children}</TicketGuard>;
}
