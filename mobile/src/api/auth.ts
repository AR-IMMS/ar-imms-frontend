import { ApiRequestError, requestResponse } from './client';
import { list, positive, record, text } from './core-contract';

export type AuthUser = { id: string; userId: string; username: string; fullName: string; email: string; roles: string[]; permissions: string[] };
type Tokens = { access: string; refresh: string; expires: number; change: boolean };
export type NativeIdentity = { user: AuthUser | null; change: boolean };
type SessionVault = { read: () => Promise<string | null>; save: (refresh: string) => Promise<void>; clear: () => Promise<void> };
function tokens(value: unknown): Tokens {
  const dto = record(value);
  if (dto.token_type !== 'Bearer' || typeof dto.must_change_password !== 'boolean') throw new Error('Invalid IAM session.');
  return { access: text(dto.access_token), refresh: text(dto.refresh_token), expires: Date.now() + positive(dto.expires_in) * 1000, change: dto.must_change_password };
}
function profile(value: unknown): AuthUser {
  const dto = record(value);
  const permissions = list(dto.effective_permissions, text);
  if (dto.role !== 'TECHNICIAN' || dto.status !== 'ACTIVE' || !permissions.includes('ticket:read')) {
    throw new ApiRequestError('An active Technician account with Ticket access is required.', 403);
  }
  const id = text(dto.user_id), username = text(dto.username);
  return { id, userId: id, username, fullName: typeof dto.display_name === 'string' && dto.display_name.trim() ? dto.display_name : username, email: text(dto.email), roles: ['TECHNICIAN'], permissions };
}

export class NativeSession {
  private current?: Tokens;
  private refreshFlight?: { epoch: number; promise: Promise<void> };
  private vaultQueue: Promise<void> = Promise.resolve();
  private epoch = 0;
  private body(method: string, data: unknown, token?: string) { return { method, body: JSON.stringify(data), token }; }
  constructor(readonly base: string, private readonly vault: SessionVault, private readonly onInvalid: () => void) {}

  private async json(path: string, options?: Parameters<typeof requestResponse>[2]) {
    return record(await (await requestResponse(this.base, path, options)).json()).data;
  }

  private queueVault(work: () => Promise<void>) {
    const next = this.vaultQueue.then(work);
    this.vaultQueue = next.catch(() => {});
    return next;
  }

  private async adopt(next: Tokens, epoch: number) {
    if (epoch !== this.epoch) throw new ApiRequestError('Session changed.', 401);
    this.current = next;
    try { await this.queueVault(async () => { if (epoch === this.epoch) await this.vault.save(next.refresh); }); }
    catch (error) { if (epoch === this.epoch) await this.clear(); throw error; }
    if (epoch !== this.epoch) throw new ApiRequestError('Session changed.', 401);
  }

  private async clear() {
    this.epoch++;
    this.current = undefined;
    this.onInvalid();
    await this.queueVault(() => this.vault.clear());
  }

  private rotate(refresh: string) {
    const epoch = this.epoch;
    if (this.refreshFlight?.epoch !== epoch) {
      const promise = this.json('/auth/refresh', this.body('POST', { refresh_token: refresh }))
        .then(value => this.adopt(tokens(value), epoch))
        .catch(async (error) => {
          if (epoch === this.epoch && error instanceof ApiRequestError && [400, 401, 403].includes(error.status ?? 0)) await this.clear();
          throw error;
        }).finally(() => { if (this.refreshFlight?.epoch === epoch) this.refreshFlight = undefined; });
      this.refreshFlight = { epoch, promise };
    }
    return this.refreshFlight.promise;
  }

  async login(identifier: string, password: string) {
    await this.clear();
    const epoch = this.epoch;
    await this.adopt(tokens(await this.json('/auth/login', this.body('POST', { identifier, password }))), epoch);
    return this.verifyIdentity();
  }

  async restore(): Promise<NativeIdentity | null> {
    const current = await this.vault.read();
    if (!current) return null;
    await this.rotate(current);
    return this.verifyIdentity();
  }

  async verifyIdentity(): Promise<NativeIdentity> {
    if (!this.current) throw new ApiRequestError('Sign in first.', 401);
    if (this.current.change) return { user: null, change: true };
    try {
      const response = await this.request('/auth/me');
      return { user: profile(record(await response.json()).data), change: false };
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403) await this.logout().catch(() => {});
      throw error;
    }
  }

  async withAccess<T>(action: (token: string) => Promise<T>): Promise<T> {
    const epoch = this.epoch;
    const rejectStale = () => {
      if (epoch !== this.epoch || !this.current) throw new ApiRequestError('Session changed. Sign in again.', 401);
      return this.current;
    };
    const original = rejectStale();
    if (original.expires <= Date.now() + 5000) await this.rotate(original.refresh);
    const sent = rejectStale();
    try {
      const result = await action(sent.access);
      rejectStale();
      return result;
    } catch (error) {
      if (!(error instanceof ApiRequestError) || error.status !== 401) throw error;
    }
    const latest = rejectStale();
    if (latest.access === sent.access) await this.rotate(latest.refresh);
    try {
      const result = await action(rejectStale().access);
      rejectStale();
      return result;
    } catch (error) {
      if (epoch === this.epoch && error instanceof ApiRequestError && error.status === 401) await this.clear();
      throw error;
    }
  }

  request(path: string, options?: RequestInit) {
    return this.withAccess(token => requestResponse(this.base, path, { ...options, token }));
  }
  async changePassword(password: string) {
    await this.request('/auth/change-password', this.body('POST', { new_password: password }));
    // Core can revoke the current session on first-use. Require a fresh verified login.
    await this.clear();
  }

  async logout() {
    try { if (this.current) await this.request('/auth/logout', { method: 'POST' }); }
    finally { await this.clear(); }
  }
}
