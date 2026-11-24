import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/auth-context';
import { ApiRequestError } from './client';
import { apiConfig } from './config';
import { listTickets, priorities, links, type Priority, type Ticket, type TicketQuery } from './tickets';

export function useAssignedTickets(filters: TicketQuery = {}, assetSummary = false) {
  const { core, session } = useAuth();
  const actor = session?.user.id;
  const scope = JSON.stringify([actor, filters.state, filters.priority, filters.search]);
  const choice = useMemo(() => ({ state: filters.state, priority: filters.priority, search: filters.search }),
    [filters.state, filters.priority, filters.search]);
  const [result, setResult] = useState<{ scope: string; tickets: Ticket[]; cursor: string | null }>({ scope: '', tickets: [], cursor: null });
  const [catalog, setCatalog] = useState<Priority[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const version = useRef(0);
  const active = useRef(false);
  const load = useCallback(async (cursor?: string) => {
    if (!actor || !active.current) return;
    const generation = ++version.current;
    setLoading(true); setError('');
    if (!cursor) setResult({ scope, tickets: [], cursor: null });
    try {
      const metadata = await priorities(core).catch(() => []);
      const page = await listTickets(core, actor, metadata, apiConfig.ticketStateIds, { ...choice, cursor });
      const denied = new Set<string>();
      if (assetSummary) {
        await Promise.all(page.items.slice(0, 4).map(async row => {
          try {
            const context = await links(core, row.id);
            if (context.assets.length) row.assetRef = { code: context.assets.length + (context.assets.length === 1 ? ' related asset' : ' related assets') };
          } catch (error) {
            if (error instanceof ApiRequestError && [401, 403, 404].includes(error.status ?? 0)) denied.add(row.id);
          }
        }));
      }
      if (generation !== version.current || !active.current) return;
      setCatalog(metadata);
      setResult(previous => {
        const items = (cursor && previous.scope === scope ? [...previous.tickets, ...page.items] : page.items).filter(item => !denied.has(item.id));
        return { scope, tickets: [...new Map(items.map(item => [item.id, item])).values()],
          cursor: page.nextCursor === cursor ? null : page.nextCursor };
      });
    } catch (error) {
      if (generation !== version.current || !active.current) return;
      setResult({ scope, tickets: [], cursor: null });
      setError(error instanceof Error ? error.message : 'Could not load Tickets.');
    } finally {
      if (generation === version.current && active.current) setLoading(false);
    }
  }, [actor, core, scope, choice, assetSummary]);
  useFocusEffect(useCallback(() => {
    active.current = true;
    void load();
    const wake = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => {
      active.current = false; version.current++; wake.remove();
      setResult({ scope: '', tickets: [], cursor: null });
    };
  }, [load]));
  const current = result.scope === scope;
  return { tickets: current ? result.tickets : [], catalog, error, loading,
    refresh: () => load(), more: current && result.cursor ? () => load(result.cursor ?? undefined) : null };
}
