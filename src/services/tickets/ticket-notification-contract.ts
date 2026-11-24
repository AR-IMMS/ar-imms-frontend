import { z } from 'zod';

const titles = {
  created: 'New Ticket',
  responsibilities_changed: 'Assignment updated',
  information_changed: 'Ticket updated',
  progressed: 'Ticket status updated',
  closed: 'Ticket closed',
  reopened: 'Ticket reopened',
  article_added: 'New Ticket note',
  evidence_added: 'Evidence attached',
} as const;

export const ticketNotificationInbox = z
  .object({
    items: z
      .array(
        z.object({
          id: z.uuid(),
          kind: z.enum(
            Object.keys(titles) as [
              keyof typeof titles,
              ...(keyof typeof titles)[],
            ]
          ),
          ticket_id: z.number().int().positive(),
          ticket_number: z.string().min(1),
          ticket_title: z.string().min(1),
          occurred_at: z.iso.datetime({ offset: true }),
          read: z.boolean(),
        })
      )
      .max(20),
    unread_count: z.number().int().min(0).max(20),
  })
  .refine(
    ({ items, unread_count }) =>
      unread_count === items.filter((item) => !item.read).length
  )
  .transform(({ items, unread_count }) => ({
    unreadCount: unread_count,
    items: items.map((item) => ({ ...item, label: titles[item.kind] })),
  }));
