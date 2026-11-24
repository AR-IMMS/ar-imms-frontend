/* global __dirname:readonly */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');

const mobile = path.resolve(__dirname, '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'wf04-ui-'));
const origin = 'http://localhost:48766';
const core = 'http://127.0.0.1:48767';
const stateIds = { NEW: 1, OPEN: 2, PENDING: 3, CLOSED: 4 };
const screenshots = process.env.WF04_UI_SCREENSHOTS;
let browser;

before(async () => {
  const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
  execFileSync(process.execPath, [cli, 'export', '--platform', 'web', '--max-workers', '2', '--output-dir', output], {
    cwd: mobile, stdio: 'pipe', env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_CORE_API_URL: core,
      EXPO_PUBLIC_TICKET_STATE_IDS: JSON.stringify(stateIds) },
  });
  browser = await chromium.launch({ channel: process.env.WF04_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium') });
  if (screenshots) fs.mkdirSync(screenshots, { recursive: true });
});
after(async () => {
  await browser?.close();
  fs.rmSync(output, { recursive: true, force: true });
});

async function fixture(t, permissions = ['ticket:read', 'ticket:work']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  const model = { state: 'NEW', nextFailure: 0, code: '', writes: [] };
  const row = () => ({ ticket_id: 42, number: '11042', title: 'Inspect cooling loop', priority_id: 8,
    state_id: stateIds[model.state], created_at: '2026-03-02T07:00:00Z', updated_at: '2026-03-03T10:00:00Z' });
  const pagination = { type: 'cursor', next_cursor: null };
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) {
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = path.resolve(output, relative.includes('.') ? relative : 'index.html');
      if (!file.startsWith(output + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404 });
      return route.fulfill({ path: file, contentType: file.endsWith('.js') ? 'application/javascript' : undefined });
    }
    if (url.origin !== core) return route.abort();
    const headers = { 'access-control-allow-origin': origin, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const reply = (data, status = 200) => route.fulfill({ status, headers, json: { data } });
    const endpoint = url.pathname.replace('/api/v1', '');
    switch (endpoint) {
      case '/auth/login':
      case '/auth/refresh':
        return reply({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', token_type: 'Bearer', expires_in: 900, must_change_password: false });
      case '/auth/me': return reply({ user_id: 'technician-fixture', username: 'field-tech', display_name: 'Alex Nguyen',
        email: 'tech@example.test', role: 'TECHNICIAN', status: 'ACTIVE', effective_permissions: permissions });
      case '/ticket-notifications': return reply({ items: [], unread_count: 0 });
      case '/tickets/metadata/priorities': return reply([{ id: 8, label: 'Normal', color: 'cyan' }]);
      case '/tickets': return route.fulfill({ headers, json: { data: url.searchParams.get('state') === 'CLOSED' ? [] : [row()], pagination } });
      case '/tickets/42': return reply(row());
      case '/tickets/42/links': return reply({ asset_ids: [], maintenance_activity_ids: [], incident_id: null });
      case '/tickets/42/articles': return route.fulfill({ headers, json: { data: [], pagination } });
      case '/tickets/42/evidence': return reply({ items: [], next_cursor: null, upload_available: true });
      case '/tickets/42/status': {
        const payload = request.postDataJSON();
        model.writes.push({ payload, key: request.headers()['idempotency-key'] });
        if (model.nextFailure) {
          const status = model.nextFailure;
          if (status !== 401) model.nextFailure = 0;
          if (status === -1) return route.abort('connectionreset');
          return route.fulfill({ headers, status, json: { code: model.code || 'TICKET_UNRESOLVED' } });
        }
        model.state = payload.state;
        return reply({ ticket_id: 42 });
      }
      default: return route.fulfill({ status: 404, headers });
    }
  });
  const snap = async name => { if (screenshots) await page.screenshot({ path: path.join(screenshots, name + '.png') }); };
  await page.goto(origin + '/login');
  await page.getByLabel('Username or email', { exact: true }).waitFor();
  await snap('login');
  await page.getByLabel('Username or email', { exact: true }).fill('field-tech');
  await page.getByLabel('Password', { exact: true }).fill('fixture-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Your queue is ready').first().waitFor();
  const tab = name => page.getByRole('tab', { name, exact: true });
  const button = name => page.getByRole('button', { name, exact: true });
  const detail = async () => {
    await tab('Tickets').click();
    await page.getByRole('button', { name: /11042, Inspect cooling loop/ }).click();
    await page.getByText('Work progress', { exact: true }).waitFor();
  };
  return { page, model, tab, button, snap, detail };
}

test('four evenly spaced destinations, scan outside navigation, history, profile and detail', async t => {
  const { page, tab, snap, detail } = await fixture(t);
  const tabs = page.getByRole('tab');
  assert.equal(await tabs.count(), 4);
  const boxes = await Promise.all(['Overview', 'Tickets', 'History', 'Profile'].map(name => tab(name).boundingBox()));
  boxes.forEach((box, i) => {
    assert.ok(Math.abs(box.width - boxes[0].width) < 1);
    if (i) assert.ok(Math.abs(box.x - boxes[i - 1].x - boxes[i - 1].width) < 2);
  });
  assert.equal(await page.getByRole('button', { name: 'Scan asset QR' }).count(), 0);
  await snap('overview');
  await tab('History').click();
  await page.getByText('Your completed Tickets will appear here.').waitFor();
  await tab('Profile').click();
  await page.getByText('Color mode', { exact: true }).waitFor();
  await tab('Overview').click();
  await detail();
  assert.equal(await tab('Tickets').getAttribute('aria-selected'), 'true');
  for (const name of ['Close', 'Reopen', 'Archive', 'Restore']) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 0);
});

test('Status and Priority dropdowns combine filters and reset the Core query', async t => {
  const { tab, button, page } = await fixture(t);
  await tab('Tickets').click();
  await button('Status, All active').click();
  assert.equal(await button('All active').getAttribute('aria-pressed'), 'true');
  await button('Priority, All priorities').click();
  assert.equal(await button('All active').count(), 0);
  const queryAfter = (state, priority) => page.waitForRequest(req => {
    const url = new URL(req.url());
    return req.method() === 'GET' && url.pathname === '/api/v1/tickets' &&
      url.searchParams.get('state') === state && url.searchParams.get('priority_id') === priority &&
      url.searchParams.get('assignee_user_id') === 'technician-fixture';
  });
  await Promise.all([queryAfter(null, '8'), button('Normal').click()]);
  assert.equal(await button('Priority, Normal').getAttribute('aria-expanded'), 'false');
  await button('Status, All active').click();
  await Promise.all([queryAfter('PENDING', '8'), button('Pending').click()]);
  await button('Status, Pending').waitFor();
  await Promise.all([queryAfter(null, null), button('Reset').click()]);
  await button('Priority, All priorities').waitFor();
  await button('Status, All active').waitFor();
});

for (const canWork of [true, false]) {
  test('Profile shows signed-in role, effective permissions and guide with ticket:work ' + canWork, async t => {
    const permissions = canWork ? ['ticket:read', 'ticket:work'] : ['ticket:read'];
    const { tab, button, page } = await fixture(t, permissions);
    await tab('Profile').click();
    const access = button('Workflow access');
    assert.equal(await access.getAttribute('aria-expanded'), 'false');
    await access.click();
    await page.getByText('Role · TECHNICIAN', { exact: true }).waitFor();
    await page.getByText('ticket:read', { exact: true }).waitFor();
    assert.equal(await page.getByText('ticket:work', { exact: true }).count(), canWork ? 1 : 0);
    await page.getByText(canWork ? /Set a future deadline/ : /review your assigned work/).waitFor();
    await access.click();
    assert.equal(await page.getByText('ticket:read', { exact: true }).count(), 0);
  });
}

test('all three progress transitions require review, cancellation, a valid local deadline and single submission', async t => {
  const { page, button, detail, model, snap } = await fixture(t);
  await detail();
  await button('Start work').click();
  const dialog = page.getByRole('dialog').last();
  await dialog.getByText('Ticket #11042').waitFor();
  await snap('start-work');
  assert.equal(model.writes.length, 0);
  await button('Cancel').click();
  assert.equal(model.writes.length, 0);
  await button('Start work').click();
  await dialog.getByRole('button', { name: 'Start work', exact: true }).evaluate(el => { el.click(); el.click(); });
  await button('Set pending').waitFor();
  assert.equal(model.writes.length, 1);
  await button('Set pending').click();
  const confirm = dialog.getByRole('button', { name: 'Set pending', exact: true });
  assert.ok(await confirm.isDisabled());
  await page.getByLabel('Pending until (local)').fill('2000-01-01 10:00');
  assert.ok(await confirm.isDisabled());
  const year = new Date().getFullYear() + 1;
  await page.getByLabel('Pending until (local)').fill(year + '-06-10 10:30');
  await snap('set-pending');
  await confirm.click();
  await button('Resume work').click();
  assert.equal(model.writes.length, 2);
  await dialog.getByRole('button', { name: 'Resume work', exact: true }).click();
  await button('Set pending').waitFor();
  assert.deepEqual(model.writes.map(w => w.payload.state), ['OPEN', 'PENDING', 'OPEN']);
  assert.match(model.writes[1].payload.pending_until, /T10:30:00[+-]\d\d:\d\d$/);
});

test('stale review refreshes without writing; unresolved operation blocks fresh status and replays original payload and key', async t => {
  const { page, button, detail, model } = await fixture(t);
  await detail();
  await button('Start work').click();
  model.state = 'OPEN';
  await page.getByRole('dialog').last().getByRole('button', { name: 'Start work' }).click();
  await page.getByText(/The Ticket status changed/).waitFor();
  assert.equal(model.writes.length, 0);
  model.nextFailure = 503;
  await button('Set pending').click();
  await page.getByLabel('Pending until (local)').fill((new Date().getFullYear() + 1) + '-06-10 10:30');
  await page.getByRole('dialog').last().getByRole('button', { name: 'Set pending' }).click();
  await button('Retry same request').waitFor();
  assert.ok(await button('Set pending').isDisabled());
  await button('Retry same request').click();
  await button('Resume work').waitFor();
  assert.equal(model.writes.length, 2);
  assert.ok(model.writes[0].key);
  assert.deepEqual(model.writes[0], model.writes[1]);
});

for (const status of [401, 403, 404, 409]) {
  test('Core HTTP ' + status + ' never shows a successful transition', async t => {
    const { page, button, detail, model } = await fixture(t);
    await detail();
    model.nextFailure = status;
    model.code = 'TICKET_CONFLICT';
    await button('Start work').click();
    await page.getByRole('dialog').last().getByRole('button', { name: 'Start work' }).click();
    if (status === 401) await page.getByLabel('Username or email').waitFor();
    if (status === 403 || status === 404) await button('Retry').waitFor();
    if (status === 409) {
      await page.getByText(/operation conflicts/).waitFor();
      assert.ok(await button('Start work').isEnabled());
    }
    assert.equal(await page.getByText('Core confirmed the update.').count(), 0);
    assert.equal(model.state, 'NEW');
  });
}

for (const failure of [-1, 409]) {
  test('saved status survives leaving the screen after ' + (failure === -1 ? 'connection loss' : 'an unresolved conflict'), async t => {
    const { page, model, detail, button, tab } = await fixture(t);
    await detail();
    model.nextFailure = failure;
    model.code = 'TICKET_UNRESOLVED';
    await button('Start work').click();
    await page.getByRole('dialog').last().getByRole('button', { name: 'Start work' }).click();
    await button('Retry same request').waitFor();
    await tab('Overview').click();
    await detail();
    assert.ok(await button('Start work').isDisabled());
    await button('Retry same request').click();
    await button('Set pending').waitFor();
    assert.equal(model.writes.length, 2);
    assert.deepEqual(model.writes[0], model.writes[1]);
  });
}
