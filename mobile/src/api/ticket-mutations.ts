import { randomUUID } from 'expo-crypto';
import { protectedStore } from '../auth/session-storage';
import { ApiRequestError } from './client';
import type { NativeSession } from './auth';
import { coreData, post, ticketPath } from './tickets';
import { positive, record, text } from './core-contract';

export type MutationKind = 'status' | 'articles' | 'evidence/finalize';
type Payload = { state: 'OPEN' | 'PENDING'; pending_until?: string } | { body: string } | { grant: string };
export type PendingMutation = Readonly<{ key: string; kind: MutationKind; payload: Payload; actor: string; id: string }>;
export function operationStorageKey(base: string, actor: string, id: string) {
  const scope = [base, actor, id].map(segment => segment.replace(/[^a-zA-Z0-9.-]/g, x => '_' + x.charCodeAt(0).toString(16) + '_'));
  return 'arimms.operation.' + scope.join('..');
}
export function readOperation(key: string) {
  return protectedStore.get(key).then(value => value ? JSON.parse(value) as PendingMutation : null);
}
export async function submitOperation(client: NativeSession, key: string, actor: string, id: string, kind: MutationKind, payload: Payload, previous?: PendingMutation | null) {
  const pending = previous ?? { key: randomUUID(), actor, kind, payload, id };
  if (pending.actor !== actor || pending.id !== id || pending.kind !== kind) throw new Error('Pending operation scope does not match.');
  await protectedStore.set(key, JSON.stringify(pending));
  try {
    const result = record(await coreData(client, ticketPath(id) + '/' + kind, post(pending.payload, pending.key)));
    if (kind === 'evidence/finalize') text(result.id);
    else {
      if (String(positive(result.ticket_id)) !== id) throw new Error('Core returned a receipt for another Ticket.');
      if (kind === 'articles') positive(result.article_id);
    }
    await protectedStore.remove(key);
    return result;
  } catch (error) {
    if (!previous && error instanceof ApiRequestError && [400, 413, 415].includes(error.status ?? 0)) {
      await protectedStore.remove(key);
    }
    throw error;
  }
}
