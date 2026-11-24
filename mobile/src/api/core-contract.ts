export function coreBase(raw: string | undefined): string {
  if (!raw) return '';
  const url = new URL(raw);
  const local = /^(localhost|127\.0\.0\.1|10\.0\.2\.2|10\.0\.3\.2|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username || url.password || url.search || url.hash ||
    !['/', '/api/v1', '/api/v1/'].includes(url.pathname)) {
    throw new Error('Configure the Core HTTPS URL or a private development host.');
  }
  return url.origin + '/api/v1';
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Core response.');
  return value as Record<string, unknown>;
}
export function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid Core response.');
  return value;
}
export function positive(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid Core response.');
  return value;
}
export function list<T>(value: unknown, decode: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('Invalid Core list response.');
  return value.map(decode);
}
export function page<T>(input: unknown, decode: (item: unknown) => T) {
  const envelope = record(input);
  const paging = record(envelope.pagination);
  if (paging.type !== 'cursor') throw new Error('Invalid Core pagination.');
  return { items: list(envelope.data, decode), nextCursor: paging.next_cursor === null ? null : text(paging.next_cursor) };
}

export function localDeadline(value: string, now = Date.now()): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value.trim());
  if (!parts) throw new Error('Use local time in YYYY-MM-DD HH:mm format.');
  const [year, month, day, hour, minute] = parts.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 ||
    date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute ||
    date.getTime() <= now) throw new Error('Choose a valid future local date and time.');
  const offset = -date.getTimezoneOffset();
  const pad = (n: number) => String(n).padStart(2, '0');
  return value.trim().replace(' ', 'T') + ':00' + (offset < 0 ? '-' : '+') +
    pad(Math.floor(Math.abs(offset) / 60)) + ':' + pad(Math.abs(offset) % 60);
}
