import { z } from 'zod';

export const ticketStates = ['NEW', 'OPEN', 'PENDING', 'CLOSED'] as const;
export type TicketState = (typeof ticketStates)[number];
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const uuid = z.uuid();
const date = z.iso.datetime({ offset: true });
const title = z.string().trim().min(1, 'Enter a title.').max(200);
const description = z.string().trim().min(1, 'Enter text.').max(4000);
const note = z.string().trim().min(1, 'Enter a reason or outcome.').max(500);
const ids = z
  .array(uuid)
  .max(20)
  .refine(
    (values) => new Set(values).size === values.length,
    'Use each Asset ID once.'
  );

export const ticketDto = z.object({
  ticket_id: positive,
  number: z.string().min(1),
  title: z.string(),
  state_id: positive,
  priority_id: positive,
  created_at: date,
  updated_at: date,
});
export const articleDto = z.object({
  article_id: positive,
  type: z.string(),
  internal: z.boolean(),
  body_text: z.string().nullable(),
  created_at: date,
});
export const linksDto = z.object({
  incident_id: z.string().nullable(),
  asset_ids: z.array(uuid),
  maintenance_activity_ids: z.array(z.string()),
});
export const articleReceiptDto = z.object({
  ticket_id: positive,
  article_id: positive,
});
export const cursorDto = z.object({
  type: z.literal('cursor'),
  next_cursor: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,32}$/)
    .nullable(),
});
export const searchSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[\p{L}\p{N} ]+$/u, 'Use letters, numbers, or spaces.');
export const ticketListSchema = z.strictObject({
  page_size: positive.max(25).optional(),
  state: z.enum(ticketStates).optional(),
  priority_id: positive.optional(),
  business_owner_user_id: uuid.optional(),
  assignee_user_id: uuid.optional(),
  search: searchSchema.optional(),
});
export type ListTicketsParams = z.infer<typeof ticketListSchema>;

export const ticketInputs = {
  archive: z.strictObject({ reason: note }),
  restore: z.strictObject({ reason: note }),
  evidence: z.strictObject({ grant: z.string().min(1).max(2048) }),
  create: z.strictObject({
    title,
    description,
    priority_id: positive,
    business_owner_user_id: uuid,
    assignee_user_id: uuid,
    asset_ids: ids.optional(),
  }),
  update: z
    .strictObject({ title: title.optional(), priority_id: positive.optional() })
    .refine((value) =>
      Object.values(value).some((field) => field !== undefined)
    ),
  responsibilities: z
    .strictObject({
      business_owner_user_id: uuid.optional(),
      assignee_user_id: uuid.optional(),
    })
    .refine(
      (value) => Object.values(value).some((field) => field !== undefined),
      'Enter a Business Owner or an Assignee.'
    ),
  progress: z
    .strictObject({
      state: z.enum(['OPEN', 'PENDING']),
      pending_until: date.optional(),
    })
    .refine(
      (value) => (value.state === 'PENDING') === Boolean(value.pending_until),
      {
        path: ['pending_until'],
        message: 'A deadline is required for Pending only.',
      }
    ),
  article: z.strictObject({ body: description }),
  links: z.strictObject({ asset_ids: ids }),
  close: z.strictObject({ outcome: note }),
  reopen: z.strictObject({ reason: note }),
};
export type TicketAction = keyof typeof ticketInputs;
export type TicketInput<A extends TicketAction> = z.infer<
  (typeof ticketInputs)[A]
>;
export type TicketDTO = z.infer<typeof ticketDto>;

export type Ticket = {
  id: number;
  number: string;
  title: string;
  stateId: number;
  state: TicketState | null;
  priorityId: number;
  createdAt: string;
  updatedAt: string;
};
export type TicketArticle = {
  id: number;
  type: string;
  internal: boolean;
  body: string | null;
  createdAt: string;
};
export type TicketLinks = {
  incidentId: string | null;
  assetIds: string[];
  maintenanceIds: string[];
};
export type TicketPage<T> = { items: T[]; nextCursor: string | null };
