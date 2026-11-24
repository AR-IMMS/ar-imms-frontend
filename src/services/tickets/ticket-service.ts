import { useAuthStore } from '@/stores/auth-store';
import { handleAuthError } from '@/lib/auth/auth-handlers';
import { kyClient } from '@/lib/http/ky-client';
import { coreOrigin } from '@/lib/http/core-origin';
import { z } from 'zod';
import { ticketNotificationInbox } from './ticket-notification-contract';

import {
  httpGet,
  httpGetList,
  httpPatch,
  httpPost,
} from '@/lib/http/http-methods';
import {
  articleReceiptDto,
  cursorDto,
  ticketInputs,
  ticketListSchema,
  type ListTicketsParams,
  type Ticket,
  type TicketAction,
  type TicketInput,
  type TicketPage,
} from '@/types/ticket';
import {
  mapArticle,
  mapLinks,
  mapTicket,
  ticketQuery,
} from './ticket-contract';
import { TICKET_ENDPOINTS as endpoints } from '@/lib/react-query/api-endpoint';

const options = () => ({
  service: 'ticket' as const,
  context: { core: true },
  prefix: coreOrigin(process.env.NEXT_PUBLIC_TICKET_API_URL),
});
async function page<T>(
  url: string,
  map: (_data: unknown) => T
): Promise<TicketPage<T>> {
  const result = await httpGetList<unknown>(url, options());
  return {
    items: result.data.map(map),
    nextCursor: cursorDto.parse(result.pagination).next_cursor,
  };
}
function list(params: ListTicketsParams, cursor?: string) {
  return page(
    endpoints.TICKETS +
      ticketQuery({ ...ticketListSchema.parse(params), cursor }),
    (value) => mapTicket(value)
  );
}
async function verifyOwner(ticket: Ticket, actorId: string) {
  let cursor: string | undefined;
  const search = /^[\p{L}\p{N} ]{1,80}$/u.test(ticket.title)
    ? ticket.title
    : undefined;
  for (let index = 0; index < 8; index++) {
    const result = await list(
      { business_owner_user_id: actorId, search, page_size: 25 },
      cursor
    );
    if (result.items.some((item) => item.id === ticket.id)) return true;
    if (!result.nextCursor || result.nextCursor === cursor) return false;
    cursor = result.nextCursor;
  }
  return false;
}
const archiveDto = z.object({
  ticket_id: z.number().int().positive(),
  archived: z.boolean(),
  version: z.number().int().positive(),
  archived_at: z.string(),
  archive_reason: z.string(),
  restored_at: z.string().optional(),
  restore_reason: z.string().optional(),
});
const evidenceDto = z.object({
  id: z.uuid(),
  file_name: z.string(),
  mime_type: z.enum([
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
  ]),
  file_size: z.number().int().positive(),
  created_at: z.string(),
});
const grantDto = z.object({ grant: z.string(), expires_at: z.string() });
const prioritiesDto = z.array(
  z.object({
    id: z.number().int().positive(),
    label: z.string().min(1),
    color: z.enum(['green', 'cyan', 'amber', 'critical', 'neutral']),
  })
);
export type TicketEvidenceItem = z.infer<typeof evidenceDto>;
export type TicketPriorityMetadata = z.infer<typeof prioritiesDto>[number];
const ticketPath = (id: number) => endpoints.TICKET_BY_ID(id);
const evidencePath = (id: number) => ticketPath(id) + '/evidence';
const mutations = {
  archive: {
    method: httpPost,
    url: (id: number) => ticketPath(id) + '/archive',
    map: (value: unknown) => archiveDto.parse(value),
  },
  restore: {
    method: httpPost,
    url: (id: number) => ticketPath(id) + '/restore',
    map: (value: unknown) => archiveDto.parse(value),
  },
  evidence: {
    method: httpPost,
    url: (id: number) => evidencePath(id) + '/finalize',
    map: (value: unknown) => evidenceDto.parse(value),
  },
  create: { method: httpPost, url: () => endpoints.TICKETS, map: mapTicket },
  update: { method: httpPatch, url: endpoints.TICKET_BY_ID, map: mapTicket },
  responsibilities: {
    method: httpPatch,
    url: endpoints.RESPONSIBILITIES,
    map: mapTicket,
  },
  progress: { method: httpPost, url: endpoints.STATUS, map: mapTicket },
  article: {
    method: httpPost,
    url: endpoints.ARTICLES,
    map: (value: unknown) => articleReceiptDto.parse(value),
  },
  links: { method: httpPatch, url: endpoints.LINKS, map: mapLinks },
  close: { method: httpPost, url: endpoints.CLOSE, map: mapTicket },
  reopen: { method: httpPost, url: endpoints.REOPEN, map: mapTicket },
};
async function mutate(
  action: TicketAction,
  id: number | undefined,
  payload: unknown,
  key: string
) {
  const entry = mutations[action];
  if (action !== 'create' && !id)
    throw new Error('A canonical Ticket ID is required.');
  const data = await entry.method<unknown>(
    entry.url(id ?? 0),
    ticketInputs[action].parse(payload),
    { ...options(), idempotencyKey: key, retry: { limit: 1, methods: [] } }
  );
  return entry.map(data);
}
const assetDto = z.object({
  id: z.uuid(),
  name: z.string(),
  asset_type: z.string().optional(),
  lifecycle_state: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']),
});
const directoryDto = z.object({
  id: z.uuid(),
  username: z.string().min(1),
  display_name: z.string().nullable(),
  role: z.enum(['OPERATOR', 'TECHNICIAN']),
  status: z.literal('ACTIVE'),
});
export type TicketPerson = z.infer<typeof directoryDto>;
async function lookup<T>(
  url: string,
  cursor: string | undefined,
  schema: z.ZodType<T>
): Promise<TicketPage<T>> {
  const response = await httpGetList<unknown>(
    url + ticketQuery({ cursor, page_size: 20 }),
    options()
  );
  const pagination = z
    .object({
      type: z.literal('cursor'),
      next_cursor: z.string().min(1).nullable(),
    })
    .parse(response.pagination);
  return {
    items: response.data.map((item) => schema.parse(item)),
    nextCursor: pagination.next_cursor,
  };
}

async function uploadEvidenceBytes(
  url: string,
  grant: string,
  file: File,
  onProgress: (_value: number) => void
) {
  const bytes = await file.arrayBuffer();
  function send(accessToken: string) {
    return new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('PUT', url);
      request.timeout = 60_000;
      request.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      request.setRequestHeader('Content-Type', 'application/octet-stream');
      request.setRequestHeader('X-Evidence-Grant', grant);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          resolve();
          return;
        }
        const fallback = {
          status: request.status,
          code: 'EVIDENCE_UPLOAD_FAILED',
          message: 'Evidence upload failed.',
        };
        try {
          const data = z
            .object({
              code: z.string(),
              detail: z.string(),
              request_id: z.string().optional(),
            })
            .parse(JSON.parse(request.responseText));
          reject({
            ...fallback,
            code: data.code,
            message: data.detail,
            requestId: data.request_id,
          });
        } catch {
          reject(fallback);
        }
      };
      request.ontimeout = () =>
        reject({
          status: 0,
          code: 'REQUEST_TIMEOUT',
          message: 'Evidence upload timed out.',
        });
      request.onerror = () =>
        reject({
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'Evidence upload was interrupted.',
        });
      request.onabort = request.onerror;
      request.send(bytes);
    });
  }
  const token = useAuthStore.getState().accessToken;
  if (!token)
    throw {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Sign in to upload Evidence.',
    };
  try {
    await send(token);
  } catch (error) {
    if (
      !error ||
      typeof error !== 'object' ||
      !('status' in error) ||
      error.status !== 401
    )
      throw error;
    const refreshed = await handleAuthError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Session expired',
    });
    if (!refreshed) throw error;
    await send(refreshed);
  }
}

export const ticketService = {
  list,
  notifications: async () =>
    ticketNotificationInbox.parse(
      await httpGet<unknown>('/api/v1/ticket-notifications', options())
    ),
  markNotificationsRead: async (ids: string[]) => {
    if (ids.length) {
      z.object({
        updated_count: z.number().int().min(0).max(ids.length),
      }).parse(
        await httpPost<unknown>(
          '/api/v1/ticket-notifications/read',
          { ids },
          options()
        )
      );
    }
  },
  priorities: async () =>
    prioritiesDto.parse(
      await httpGet<unknown>(
        endpoints.TICKETS + '/metadata/priorities',
        options()
      )
    ),
  archived: (cursor?: string) =>
    page(
      endpoints.TICKETS + '/archived' + ticketQuery({ cursor }),
      (value) => ({
        ticket: mapTicket(value),
        archive: z.object({ archive: archiveDto }).parse(value).archive,
      })
    ),
  evidence: async (id: number, cursor?: string) =>
    z
      .object({
        upload_available: z.boolean(),
        items: z.array(evidenceDto),
        next_cursor: z.string().nullable(),
      })
      .parse(
        await httpGet<unknown>(
          evidencePath(id) + ticketQuery({ cursor, page_size: 8 }),
          options()
        )
      ),
  prepareEvidence: async (id: number, file: File, mime: string) =>
    grantDto.parse(
      await httpPost<unknown>(
        evidencePath(id) + '/uploads',
        { file_name: file.name, file_size: file.size, mime_type: mime },
        options()
      )
    ),
  writeEvidence: async (
    id: number,
    grant: string,
    file: File,
    onProgress: (_value: number) => void
  ) => {
    await uploadEvidenceBytes(
      options().prefix + evidencePath(id) + '/uploads',
      grant,
      file,
      onProgress
    );
  },
  readEvidence: async (
    ticketId: number,
    id: string,
    disposition: 'inline' | 'attachment'
  ) => {
    const url = evidencePath(ticketId) + '/' + id;
    const { grant } = grantDto.parse(
      await httpPost<unknown>(url + '/access', { disposition }, options())
    );
    return kyClient
      .post(url + '/content', {
        ...options(),
        json: { grant },
        retry: { limit: 1, methods: [] },
      })
      .blob();
  },
  verifyOwner,
  mutate,
  assets: (cursor?: string) =>
    lookup('/api/v1/asset-topology/assets', cursor, assetDto),
  asset: async (id: string) =>
    assetDto.parse(
      await httpGet<unknown>(
        '/api/v1/asset-topology/assets/' + encodeURIComponent(id),
        options()
      )
    ),
  responsibilityUsers: (search: string, cursor?: string) =>
    page(
      endpoints.TICKETS +
        '/eligible-users' +
        ticketQuery({ search: search || undefined, cursor, page_size: 10 }),
      (item) => directoryDto.parse(item)
    ),
  get: async (id: number) =>
    mapTicket(await httpGet<unknown>(endpoints.TICKET_BY_ID(id), options())),
  articles: (id: number, cursor?: string) =>
    page(
      endpoints.ARTICLES(id) + ticketQuery({ cursor, page_size: 20 }),
      mapArticle
    ),
  links: async (id: number) =>
    mapLinks(await httpGet<unknown>(endpoints.LINKS(id), options())),
  create: (payload: TicketInput<'create'>, key: string) =>
    mutate('create', undefined, payload, key),
};
