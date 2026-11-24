'use client';
import { useId, useState } from 'react';
import { Box, Search, X } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/use-auth';
import { ticketAccess } from '@/lib/auth/ticket-access';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ticketService } from '@/services/tickets/ticket-service';
import { fieldClass, secondaryButton } from '../lib/ticket-ui';

export default function TicketAssetPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (_ids: string[], _names: Record<string, string>) => void;
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const labelId = useId();
  const enabled = ticketAccess(user).assets;
  const directory = useInfiniteQuery({
    queryKey: queryKeys.tickets.assets(user?.id),
    queryFn: ({ pageParam }) => ticketService.assets(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: expanded && enabled,
  });
  const all = directory.data?.pages.flatMap((page) => page.items) ?? [];
  const update = (ids: string[]) =>
    onChange(
      ids,
      Object.fromEntries(
        all
          .filter((asset) => ids.includes(asset.id))
          .map((asset) => [asset.id, asset.name])
      )
    );
  if (!enabled)
    return (
      <p className="text-sm text-muted-foreground">
        Asset selection requires Asset read access.
      </p>
    );
  const available = all.filter(
    (asset) =>
      asset.lifecycle_state !== 'RETIRED' &&
      !value.includes(asset.id) &&
      [asset.name, asset.asset_type, asset.id].some((part) =>
        part?.toLowerCase().includes(search.trim().toLowerCase())
      )
  );
  return (
    <section
      aria-labelledby={labelId}
      className="min-w-0 space-y-3 rounded-xl border border-cyan/15 bg-background/30 p-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan">
          <Box className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 grow">
          <h3 id={labelId} className="text-sm font-semibold">
            Related Assets
          </h3>
          <p className="text-xs text-muted-foreground">
            {value.length} / 20 selected
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          className={secondaryButton}
          onClick={() => setExpanded((show) => !show)}
        >
          {expanded ? 'Hide Assets' : 'Choose Assets'}
        </button>
      </div>
      {value.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((id) => {
            const asset = all.find((item) => item.id === id);
            return (
              <li
                key={id}
                className="flex min-w-0 items-start gap-2 rounded-lg border border-cyan/20 bg-cyan/8 p-2.5"
              >
                <Box className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-xs font-semibold">
                    {asset?.name ?? 'Asset reference'}
                  </p>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-muted-foreground">
                    {asset?.asset_type ?? id}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:text-critical focus-visible:outline-2 focus-visible:outline-cyan"
                  aria-label={'Remove Asset ' + (asset?.name ?? id)}
                  onClick={() => update(value.filter((item) => item !== id))}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {expanded && (
        <div className="grid gap-2 border-t border-border pt-3">
          <label className="relative block">
            <span className="sr-only">Search loaded Assets</span>
            <Search
              className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
              aria-hidden
            />
            <input
              className={fieldClass + ' pl-9'}
              placeholder="Search loaded Assets"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          {directory.isLoading && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading Assets...
            </p>
          )}
          {directory.isError && (
            <p role="alert" className="text-sm text-critical">
              Asset directory unavailable.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => void directory.refetch()}
              >
                Retry
              </button>
            </p>
          )}
          <select
            className={fieldClass}
            aria-label="Add related Asset"
            value=""
            disabled={value.length >= 20 || !available.length}
            onChange={(event) => {
              if (event.target.value) update([...value, event.target.value]);
            }}
          >
            <option value="">
              {available.length
                ? 'Select an Asset'
                : 'No matching Assets on loaded pages'}
            </option>
            {available.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
                {asset.asset_type ? ' · ' + asset.asset_type : ''}
              </option>
            ))}
          </select>
          {directory.hasNextPage && (
            <button
              type="button"
              className={secondaryButton}
              disabled={directory.isFetchingNextPage}
              onClick={() => void directory.fetchNextPage()}
            >
              Load more Assets
            </button>
          )}
        </div>
      )}
    </section>
  );
}
