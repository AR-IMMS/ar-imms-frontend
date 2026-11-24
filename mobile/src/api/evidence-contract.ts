import type { NativeSession } from './auth';
import { record, text } from './core-contract';
import { coreData, post, ticketPath } from './tickets';

export const evidenceLimit = 8 * 1024 * 1024;
export const ticketEvidencePath = (id: string) => ticketPath(id) + '/evidence';
export function evidenceUploadHeaders(grant: string) {
  return { 'X-Evidence-Grant': grant, 'Content-Type': 'application/octet-stream' };
}

export async function authorizeEvidenceUpload(client: NativeSession, id: string, name: string, mime: string, size: number) {
  const response = record(await coreData(client, ticketEvidencePath(id) + '/uploads',
    post({ file_name: name, mime_type: mime, file_size: size })));
  const expires = Date.parse(text(response.expires_at));
  if (!Number.isFinite(expires)) throw new Error('Invalid upload authorization.');
  return { grant: text(response.grant), expires };
}

export async function evidenceBytes(client: NativeSession, id: string, itemId: string, size: number, inline: boolean) {
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(itemId)) throw new Error('Invalid Evidence ID.');
  if (size <= 0 || size > evidenceLimit) throw new Error('Invalid Evidence size.');
  const base = ticketEvidencePath(id) + '/' + itemId;
  const access = record(await coreData(client, base + '/access', post({ disposition: inline ? 'inline' : 'attachment' })));
  const response = await client.request(base + '/content', post({ grant: text(access.grant) }));
  const length = response.headers.get('Content-Length');
  if (length !== null && Number(length) !== size) throw new Error('Invalid Evidence size.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length !== size) throw new Error('Invalid Evidence content.');
  return bytes;
}
