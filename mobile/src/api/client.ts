import { record } from './core-contract';

type RequestOptions = RequestInit & { token?: string | null; timeoutMs?: number };
export class ApiRequestError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function requestResponse(base: string, path: string, options: RequestOptions = {}) {
  if (!base || !path.startsWith('/') || path.startsWith('//')) throw new ApiRequestError('Configure the Core API URL for this device.');
  const { token, timeoutMs = 15_000, signal, ...rest } = options;
  const headers = new Headers(rest.headers);
  if (!headers.has('Content-Type') && typeof rest.body === 'string') headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(base + path, { ...rest, headers, signal: controller.signal, redirect: 'error' });
    if (!response.ok) {
      const body = await response.json().then(record).catch(() => ({} as Record<string, unknown>));
      throw new ApiRequestError(
        response.status === 404 ? 'This Ticket is no longer available.' :
          response.status === 403 ? 'You do not have access to this operation.' :
          response.status === 409 ? 'The operation conflicts or its outcome is uncertain.' :
          response.status === 503 ? 'Core dependency is temporarily unavailable.' :
          (typeof body.detail === 'string' ? body.detail : 'Request failed (' + response.status + ').'),
        response.status, typeof body.code === 'string' ? body.code : undefined,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('Could not complete the request. Check your connection and retry.', undefined, 'NETWORK');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function requestJson<T>(_base: string, _path: string, _options: RequestOptions = {}): Promise<T> {
  throw new ApiRequestError('This legacy service is unavailable with a Core session.', 503);
}
