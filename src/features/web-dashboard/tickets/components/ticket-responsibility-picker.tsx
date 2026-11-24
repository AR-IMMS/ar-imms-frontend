'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, UserRound, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useAuth } from '@/hooks/auth/use-auth';
import {
  ticketService,
  type TicketPerson,
} from '@/services/tickets/ticket-service';
import { fieldClass, secondaryButton } from '../lib/ticket-ui';

const roles = {
  OPERATOR: 'System Monitoring Operator',
  TECHNICIAN: 'Maintenance Technician',
};
export const personLabel = (person: TicketPerson) =>
  person.display_name?.trim() || person.username;
export default function TicketResponsibilityPicker({
  label,
  value,
  onChange,
  required = false,
  error,
}: {
  label: string;
  value: TicketPerson | null;
  onChange: (_value: TicketPerson | null) => void;
  required?: boolean;
  error?: string;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const id = useId();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const directory = useInfiniteQuery({
    queryKey: ['tickets', 'eligible-users', user?.id, debounced],
    queryFn: ({ pageParam }) =>
      ticketService.responsibilityUsers(debounced, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(user?.id),
    retry: false,
    staleTime: 30_000,
  });
  const people = directory.data?.pages.flatMap((page) => page.items) ?? [];
  const waiting = directory.isPending || search.trim() !== debounced;
  const options =
    value && !people.some(({ id }) => id === value.id)
      ? [value, ...people]
      : people;
  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-cyan/15 bg-background/25 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <UserRound className="size-4 text-cyan" aria-hidden />
        {label}
        {required && <span className="text-cyan">*</span>}
      </p>
      <label className="relative block">
        <span className="sr-only">Search {label} directory</span>
        <Search
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
          aria-hidden
        />
        <input
          className={fieldClass + ' pl-9'}
          value={search}
          maxLength={80}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or username"
        />
      </label>
      <select
        aria-label={'Select ' + label}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? id : undefined}
        aria-required={required}
        className={fieldClass}
        value={value?.id ?? ''}
        disabled={waiting || !options.length}
        onChange={(event) =>
          onChange(
            options.find((person) => person.id === event.target.value) ?? null
          )
        }
      >
        <option value="">
          {required ? 'Choose an eligible user' : 'No selection'}
        </option>
        {options.map((person) => (
          <option key={person.id} value={person.id}>
            {personLabel(person)} (@{person.username})
          </option>
        ))}
      </select>
      {waiting && (
        <div
          role="status"
          className="h-4 animate-pulse rounded bg-cyan/10 text-xs text-muted-foreground"
        >
          Searching eligible users...
        </div>
      )}
      {!waiting && directory.isError && (
        <p role="alert" className="text-xs text-critical">
          Could not load eligible users.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => void directory.refetch()}
          >
            Retry
          </button>
        </p>
      )}
      {!waiting && !directory.isError && !people.length && (
        <p role="status" className="text-xs text-muted-foreground">
          {directory.hasNextPage
            ? 'No matching users on this page.'
            : 'No eligible users found.'}
        </p>
      )}
      {!waiting && directory.hasNextPage && (
        <button
          type="button"
          className={secondaryButton}
          disabled={directory.isFetching}
          onClick={() => void directory.fetchNextPage()}
        >
          {directory.isFetchingNextPage ? 'Loading...' : 'Search more users'}
        </button>
      )}
      {value && (
        <div className="flex items-center gap-2 rounded-md border border-cyan/20 bg-cyan/10 p-2">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan/15 text-xs text-cyan"
          >
            {personLabel(value)
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0])
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0 grow">
            <p className="break-words text-sm font-semibold">
              {personLabel(value)}
            </p>
            <p className="break-words text-xs text-muted-foreground">
              @{value.username} / {roles[value.role]} / Active
            </p>
          </div>
          <button
            type="button"
            aria-label={'Clear ' + label}
            className="rounded p-1 hover:bg-cyan/15"
            onClick={() => onChange(null)}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      {error && (
        <p id={id} role="alert" className="text-xs text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
