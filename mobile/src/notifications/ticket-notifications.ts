import type { NativeSession } from '../api/auth';
import { list, positive, record, text } from '../api/core-contract';
import { coreData, post } from '../api/tickets';

export type TicketNotificationTone =
  'cyan' | 'purple' | 'amber' | 'green' | 'red';
const presentation: Record<string, [string, TicketNotificationTone]> = {
  created: ['New Ticket', 'cyan'],
  responsibilities_changed: ['Assignment updated', 'purple'],
  information_changed: ['Ticket updated', 'cyan'],
  progressed: ['Ticket status updated', 'cyan'],
  closed: ['Ticket closed', 'green'],
  reopened: ['Ticket reopened', 'purple'],
  article_added: ['New Ticket note', 'amber'],
  evidence_added: ['Evidence attached', 'amber'],
};

export interface TicketNotification {
  id: string;
  ticketId: string;
  ticketCode: string;
  title: string;
  body: string;
  createdAt: string;
  tone: TicketNotificationTone;
  read: boolean;
}

export function decodeTicketNotifications(input: unknown) {
  const dto = record(input);
  const items = list(dto.items, (input): TicketNotification => {
    const item = record(input);
    const kind = text(item.kind);
    const createdAt = text(item.occurred_at);
    if (
      !Object.hasOwn(presentation, kind) ||
      typeof item.read !== 'boolean' ||
      !Number.isFinite(Date.parse(createdAt))
    )
      throw new Error('Invalid Ticket notification response.');
    const [title, tone] = presentation[kind];
    return {
      id: text(item.id),
      ticketId: String(positive(item.ticket_id)),
      ticketCode: text(item.ticket_number),
      title,
      body: text(item.ticket_title),
      createdAt,
      tone,
      read: item.read,
    };
  });
  const unreadCount = items.filter((item) => !item.read).length;
  if (items.length > 20 || dto.unread_count !== unreadCount)
    throw new Error('Invalid Ticket notification count.');
  return { items, unreadCount };
}

export async function fetchTicketNotifications(core: NativeSession) {
  return decodeTicketNotifications(
    await coreData(core, '/ticket-notifications')
  );
}

export async function readTicketNotifications(
  core: NativeSession,
  ids: string[]
) {
  if (ids.length) {
    const result = record(
      await coreData(core, '/ticket-notifications/read', post({ ids }))
    );
    if (
      result.updated_count !== 0 &&
      positive(result.updated_count) > ids.length
    )
      throw new Error('Invalid Ticket notification receipt.');
  }
}
