'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useAuth } from '@/hooks/auth/use-auth';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ticketService } from '@/services/tickets/ticket-service';
import {
  errorInfo,
  isDefinitiveFailure,
  newOperation,
  operationRecord,
  type OperationRecord,
} from '@/services/tickets/ticket-operation';
import type { TicketAction } from '@/types/ticket';

const changeEvent = 'wf04-operation';
const inFlight = new Set<string>();
const subscribe = (notify: () => void) => {
  window.addEventListener(changeEvent, notify);
  return () => window.removeEventListener(changeEvent, notify);
};
const noPending = () => null;

function read(raw: string | null) {
  return raw === null ? null : operationRecord.parse(JSON.parse(raw));
}
export function useTicketOperation(action: TicketAction, id?: number) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const slot =
    'wf04:' +
    JSON.stringify([
      process.env.NEXT_PUBLIC_TICKET_API_URL ?? '',
      user?.id,
      action,
      id ?? 'new',
    ]);
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(slot);
      } catch {
        return null;
      }
    },
    noPending
  );
  let pending: OperationRecord | null = null;
  try {
    pending = read(snapshot);
  } catch {
    /* A corrupt receipt blocks a new write below. */
  }
  function save(next: OperationRecord | null) {
    if (next) sessionStorage.setItem(slot, JSON.stringify(next));
    else sessionStorage.removeItem(slot);
    window.dispatchEvent(new Event(changeEvent));
  }
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({
      input,
      retry,
    }: {
      input?: unknown;
      retry?: boolean;
    }) => {
      if (!user?.id || inFlight.has(slot))
        throw new Error('Another submission is already in progress.');
      const stored = read(sessionStorage.getItem(slot));
      if (stored && !retry)
        throw new Error(
          'Resolve the pending operation before starting another.'
        );
      if (!stored && retry)
        throw new Error('There is no pending operation to retry.');
      const entry = stored ?? newOperation(action, input);
      inFlight.add(slot);
      try {
        save(entry);
        try {
          const result = await ticketService.mutate(
            action,
            id,
            entry.payload,
            entry.key
          );
          save(null);
          return result;
        } catch (error) {
          if (!stored && isDefinitiveFailure(error)) save(null);
          else
            save({
              ...entry,
              requestId: errorInfo(error).requestId ?? entry.requestId,
            });
          throw error;
        }
      } finally {
        inFlight.delete(slot);
      }
    },
    onSettled: (result, error) => {
      if (
        result ||
        errorInfo(error).status === 404 ||
        errorInfo(error).status === 403
      )
        return cache.invalidateQueries({ queryKey: queryKeys.tickets.all });
    },
  });
  return {
    ...mutation,
    pending,
    submit: (input: unknown) => mutation.mutateAsync({ input }),
    retryPending: () => mutation.mutateAsync({ retry: true }),
  };
}
