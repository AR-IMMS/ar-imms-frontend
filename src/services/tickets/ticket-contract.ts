import {
  articleDto,
  linksDto,
  ticketDto,
  ticketStates,
  type Ticket,
  type TicketState,
} from '../../types/ticket';
import { z } from 'zod';

export const stateIdsSchema = z
  .object({
    NEW: z.number().int().positive(),
    OPEN: z.number().int().positive(),
    PENDING: z.number().int().positive(),
    CLOSED: z.number().int().positive(),
  })
  .refine((value) => new Set(Object.values(value)).size === 4);
export type StateIds = z.infer<typeof stateIdsSchema>;
export function parseStateIds(value?: string): StateIds | null {
  if (!value) return null;
  try {
    return stateIdsSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
}
export const configuredStates = parseStateIds(
  process.env.NEXT_PUBLIC_TICKET_STATE_IDS
);
export function mapTicket(value: unknown, states = configuredStates): Ticket {
  const dto = ticketDto.parse(value);
  return {
    id: dto.ticket_id,
    number: dto.number,
    title: dto.title,
    stateId: dto.state_id,
    state:
      ticketStates.find((state) => states?.[state] === dto.state_id) ?? null,
    priorityId: dto.priority_id,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}
export function mapArticle(value: unknown) {
  const dto = articleDto.parse(value);
  return {
    id: dto.article_id,
    type: dto.type,
    internal: dto.internal,
    body: dto.body_text,
    createdAt: dto.created_at,
  };
}
export function mapLinks(value: unknown) {
  const dto = linksDto.parse(value);
  return {
    incidentId: dto.incident_id,
    assetIds: dto.asset_ids,
    maintenanceIds: dto.maintenance_activity_ids,
  };
}
export function nextProgress(state: TicketState | null) {
  if (state === 'NEW' || state === 'PENDING') return 'OPEN';
  if (state === 'OPEN') return 'PENDING';
  return null;
}
export function ticketQuery(
  input: Record<string, string | number | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined) params.set(key, String(value));
  const query = params.toString();
  return query ? '?' + query : '';
}
