'use client';
import TicketResponsibilityPicker from './ticket-responsibility-picker';
import type { TicketPerson } from '@/services/tickets/ticket-service';
import { useTicketPriorities } from '@/hooks/tickets/use-ticket-priorities';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import {
  ticketListSchema,
  ticketStates,
  type ListTicketsParams,
} from '@/types/ticket';
import {
  fieldClass,
  panelClass,
  secondaryButton,
  ticketPriority,
} from '../lib/ticket-ui';

export default function TicketListFilters({
  filters,
  onChange,
  showAssignee,
  showOwner,
}: {
  filters: ListTicketsParams;
  onChange: (_params: ListTicketsParams) => void;
  showAssignee: boolean;
  showOwner: boolean;
}) {
  const priorityQuery = useTicketPriorities();
  const priorities = priorityQuery.data ?? [];
  const [owner, setOwner] = useState<TicketPerson | null>(null);
  const [assignee, setAssignee] = useState<TicketPerson | null>(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const errorId = useId();
  const priorityId = useId();
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const raw = Object.fromEntries(
      [...data.entries()].flatMap(([key, value]) =>
        typeof value === 'string' && value.trim()
          ? [[key, key === 'priority_id' ? Number(value) : value.trim()]]
          : []
      )
    );
    const parsed = ticketListSchema.safeParse({
      ...raw,
      ...(priorityQuery.isError && !priorities.length && filters.priority_id
        ? { priority_id: filters.priority_id }
        : {}),
      ...(owner ? { business_owner_user_id: owner.id } : {}),
      ...(assignee ? { assignee_user_id: assignee.id } : {}),
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0].path[0];
      setError(
        field === 'search'
          ? 'Search must have 1-80 letters, numbers, or spaces.'
          : field === 'priority_id'
            ? 'Choose an available priority.'
            : 'Choose an eligible user.'
      );
      return;
    }
    setError('');
    onChange(parsed.data);
  }
  function clear() {
    setError('');
    onChange({});
    setOwner(null);
    setAssignee(null);
    setVersion((value) => value + 1);
  }
  const chips = [
    filters.search && 'Title: ' + filters.search,
    filters.state,
    filters.priority_id &&
      ticketPriority(filters.priority_id, priorities).label,
    filters.business_owner_user_id && 'Business Owner',
    filters.assignee_user_id && 'Assignee',
  ].filter(Boolean);
  return (
    <form
      key={version}
      noValidate
      onSubmit={apply}
      aria-describedby={error ? errorId : undefined}
      className={panelClass + ' space-y-3 p-4'}
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr] xl:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
        <label className="relative grid gap-1.5">
          <span className="label-mono text-[10px] text-muted-foreground">
            Search titles
          </span>
          <Search
            aria-hidden
            className="pointer-events-none absolute bottom-3 left-3 size-4 text-cyan-ice"
          />
          <input
            name="search"
            defaultValue={filters.search}
            className={fieldClass + ' pl-9'}
            placeholder="Search Ticket titles"
            maxLength={80}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="label-mono text-[10px] text-muted-foreground">
            State
          </span>
          <select
            name="state"
            defaultValue={filters.state ?? ''}
            className={fieldClass}
          >
            <option value="">All states</option>
            {ticketStates.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-1.5">
          <label
            htmlFor={priorityId}
            className="label-mono text-[10px] text-muted-foreground"
          >
            Priority
          </label>
          <select
            id={priorityId}
            name="priority_id"
            defaultValue={filters.priority_id ?? ''}
            className={fieldClass}
            disabled={!priorities.length}
          >
            <option value="">
              {priorities.length ? 'All priorities' : 'Priorities unavailable'}
            </option>
            {filters.priority_id &&
              !priorities.some(({ id }) => id === filters.priority_id) && (
                <option value={filters.priority_id}>Unknown priority</option>
              )}
            {priorities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {!priorities.length && !priorityQuery.isPending && (
            <button
              type="button"
              className="justify-self-start text-xs text-cyan underline"
              onClick={() => void priorityQuery.refetch()}
            >
              Retry priorities
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2 md:col-span-3 xl:col-span-1">
          <button className={secondaryButton}>Apply filters</button>
          <button className={secondaryButton} type="button" onClick={clear}>
            <X className="size-4" aria-hidden />
            Reset
          </button>
        </div>
      </div>
      {(showOwner || showAssignee) && (
        <details className="text-sm text-muted-foreground">
          <summary className="w-fit cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-cyan">
            <SlidersHorizontal className="mr-2 inline size-3.5" aria-hidden />
            Responsibility filters
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {showOwner && (
              <TicketResponsibilityPicker
                label="Business Owner filter"
                value={owner}
                onChange={setOwner}
              />
            )}
            {showAssignee && (
              <TicketResponsibilityPicker
                label="Assignee filter"
                value={assignee}
                onChange={setAssignee}
              />
            )}
          </div>
        </details>
      )}
      {chips.length > 0 && (
        <div aria-label="Active filters" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-md border border-cyan/30 bg-cyan/10 px-2 py-1 text-xs text-cyan-ice"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
    </form>
  );
}
