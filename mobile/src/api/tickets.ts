import type { NativeSession } from './auth';
import { list, page, positive, record, text } from './core-contract';

export type State = 'NEW' | 'OPEN' | 'PENDING' | 'CLOSED';
const states: State[] = ['NEW', 'OPEN', 'PENDING', 'CLOSED'];
export type Priority = { id: number; label: string; color: 'green' | 'cyan' | 'amber' | 'critical' | 'neutral' };
export type Ticket = {
  id: string; ticketCode: string; title: string; priorityId: number; priority: string;
  priorityColor: Priority['color']; status: State | 'UNKNOWN'; createdAt: string; updatedAt: string;
  assetRef?: { code: string };
};
export type Article = { id: number; body: string | null; createdAt: string };
export type EvidenceItem = { id: string; name: string; mime: string; size: number; createdAt: string };
export type TicketLinks = { assets: string[]; incident: string | null; maintenance: string[] };
export type TicketQuery = { state?: State; priority?: number; search?: string; cursor?: string };

export function ticketPath(id: string) {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw new Error('Invalid Ticket ID.');
  return '/tickets/' + id;
}
export function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  return query.size ? '?' + query.toString() : '';
}
function stateIdMap(raw?: string) {
  if (!raw) return [];
  try {
    const dto = record(JSON.parse(raw));
    const ids = states.map(state => positive(dto[state]));
    return new Set(ids).size === ids.length ? ids : [];
  } catch { return []; }
}
export function ticketView(input: unknown, catalog: Priority[], stateIds?: string): Ticket {
  const dto = record(input);
  const priorityId = positive(dto.priority_id);
  const priority = catalog.find(x => x.id === priorityId);
  const status = states[stateIdMap(stateIds).indexOf(positive(dto.state_id))] ?? 'UNKNOWN';
  const createdAt = text(dto.created_at), updatedAt = text(dto.updated_at);
  if (!Number.isFinite(Date.parse(createdAt)) || !Number.isFinite(Date.parse(updatedAt))) throw new Error('Invalid Ticket timestamps.');
  return { id: String(positive(dto.ticket_id)), ticketCode: text(dto.number), title: text(dto.title),
    priorityId, priority: priority?.label ?? 'Unknown priority', priorityColor: priority?.color ?? 'neutral',
    status, createdAt, updatedAt };
}
export async function coreData(client: NativeSession, path: string, options?: RequestInit) {
  return record(await (await client.request(path, options)).json()).data;
}
export function post(body: unknown, key?: string): RequestInit {
  return { method: 'POST', body: JSON.stringify(body), headers: key ? { 'Idempotency-Key': key } : undefined };
}
export async function priorities(client: NativeSession) {
  return list(await coreData(client, '/tickets/metadata/priorities'), (value): Priority => {
    const p = record(value);
    if (p.color !== 'green' && p.color !== 'cyan' && p.color !== 'amber' && p.color !== 'critical' && p.color !== 'neutral') throw new Error('Invalid priority color.');
    return { id: positive(p.id), label: text(p.label), color: p.color };
  });
}
export async function listTickets(client: NativeSession, user: string, catalog: Priority[], stateIds: string | undefined, filters: TicketQuery = {}) {
  const path = '/tickets' + queryString({ assignee_user_id: user, page_size: 20, cursor: filters.cursor,
    state: filters.state, priority_id: filters.priority, search: filters.search });
  return page(await (await client.request(path)).json(), x => ticketView(x, catalog, stateIds));
}
export async function getTicket(client: NativeSession, id: string, catalog: Priority[], stateIds?: string) {
  return ticketView(await coreData(client, ticketPath(id)), catalog, stateIds);
}
export async function links(client: NativeSession, id: string): Promise<TicketLinks> {
  const dto = record(await coreData(client, ticketPath(id) + '/links'));
  return { assets: list(dto.asset_ids, text), incident: dto.incident_id === null ? null : text(dto.incident_id), maintenance: list(dto.maintenance_activity_ids, text) };
}
export async function assetName(client: NativeSession, id: string) {
  const dto = record(await coreData(client, '/asset-topology/assets/' + encodeURIComponent(id)));
  if (dto.id !== id) throw new Error('Invalid Asset response.');
  return text(dto.name);
}
export async function articles(client: NativeSession, id: string, cursor?: string) {
  const path = ticketPath(id) + '/articles' + queryString({ page_size: 20, cursor });
  const result = page(await (await client.request(path)).json(), (row): Article | null => {
    const dto = record(row);
    if (dto.internal === false) return null;
    if (dto.internal !== true || (dto.body_text !== null && typeof dto.body_text !== 'string')) throw new Error('Invalid internal Article response.');
    return { id: positive(dto.article_id), body: dto.body_text, createdAt: text(dto.created_at) };
  });
  return { ...result, items: result.items.filter((item): item is Article => item !== null) };
}
export function nextAction(state: Ticket['status']) {
  if (state === 'NEW') return { label: 'Start work', target: 'OPEN' } as const;
  if (state === 'OPEN') return { label: 'Set pending', target: 'PENDING' } as const;
  if (state === 'PENDING') return { label: 'Resume work', target: 'OPEN' } as const;
  return null;
}
