import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import type { NativeSession } from './auth';
import { list, positive, record, text } from './core-contract';
import { ApiRequestError } from './client';
import { coreData, queryString, type EvidenceItem } from './tickets';
import { authorizeEvidenceUpload, evidenceBytes, evidenceLimit, evidenceUploadHeaders, ticketEvidencePath } from './evidence-contract';

const MIME = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
type FileInput = { uri: string; name: string; mime?: string; size?: number };
export async function evidenceList(client: NativeSession, id: string, cursor?: string) {
  const dto = record(await coreData(client, ticketEvidencePath(id) + queryString({ cursor, page_size: 20 })));
  if (typeof dto.upload_available !== 'boolean') throw new Error('Invalid Evidence response.');
  return { enabled: dto.upload_available, nextCursor: dto.next_cursor === null ? null : text(dto.next_cursor),
    items: list(dto.items, (row): EvidenceItem => {
      const item = record(row);
      return { id: text(item.id), name: text(item.file_name), mime: text(item.mime_type), size: positive(item.file_size), createdAt: text(item.created_at) };
    }) };
}
export async function prepareEvidence(client: NativeSession, id: string, input: FileInput) {
  const file = new File(input.uri);
  const ext = input.name.split('.').pop()?.toLowerCase();
  const mime = input.mime || ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' } as Record<string, string>)[ext ?? ''];
  if (!MIME.includes(mime)) throw new Error('Choose PNG, JPEG, WebP or PDF.');
  const bytes = input.size ?? file.size;
  if (!bytes || bytes > evidenceLimit) throw new Error('Choose a file of up to 8 MiB.');
  return { uri: input.uri, ...await authorizeEvidenceUpload(client, id, input.name, mime, bytes) };
}
export type StagedUpload = Awaited<ReturnType<typeof prepareEvidence>>;
export async function transferEvidence(client: NativeSession, id: string, upload: StagedUpload, progress: (ratio: number) => void) {
  if (upload.expires <= Date.now()) throw new Error('Upload authorization expired. Select the file again.');
  const path = ticketEvidencePath(id) + '/uploads';
  async function transfer(token: string) {
    const task = FileSystem.createUploadTask(client.base + path, upload.uri, {
      httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { Authorization: 'Bearer ' + token, ...evidenceUploadHeaders(upload.grant) },
    }, event => progress(event.totalBytesExpectedToSend > 0 ? event.totalBytesSent / event.totalBytesExpectedToSend : 0));
    const result = await task.uploadAsync();
    if (!result) throw new Error('Upload interrupted. Retry the selected file.');
    if (result.status < 200 || result.status >= 300) throw new ApiRequestError('Upload failed (' + result.status + ').', result.status);
  }
  await client.withAccess(transfer);
}
export async function retrieveEvidence(client: NativeSession, id: string, item: EvidenceItem, inline: boolean) {
  const bytes = await evidenceBytes(client, id, item.id, item.size, inline);
  const extension = ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'application/pdf': '.pdf' } as Record<string, string>)[item.mime];
  if (!extension) throw new Error('Unsupported Evidence type.');
  const file = new File(Paths.cache, 'wf04-' + randomUUID() + extension);
  file.create();
  try {
    await file.write(bytes);
  } catch (error) {
    await FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => undefined);
    throw error;
  }
  return file;
}
export async function shareEvidence(file: File, mime: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: mime });
}
