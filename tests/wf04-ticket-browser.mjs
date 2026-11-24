import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.WF04_PLAYWRIGHT_MODULE;
if (!modulePath)
  throw new Error(
    'Set WF04_PLAYWRIGHT_MODULE to the Playwright module entry file.'
  );
const { default: playwright } = await import(pathToFileURL(modulePath).href);
const { chromium } = playwright;
const origin = new URL(
  process.env.WF04_BROWSER_ORIGIN ?? 'http://127.0.0.1:3000'
).origin;
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))
  throw new Error('Use an isolated loopback frontend for browser mocks.');
const output = process.env.WF04_BROWSER_OUTPUT;
if (output) mkdirSync(output, { recursive: true });
const operator = '11111111-1111-4111-8111-111111111111';
const technician = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
const asset = '44444444-4444-4444-8444-444444444444';
const timestamp = '2026-11-22T01:00:00.000Z';
const roles = {
  OPERATOR: [
    operator,
    'ticket:read',
    'ticket:create',
    'ticket:manage',
    'ticket:work',
    'ticket:close',
    'asset:read',
  ],
  TECHNICIAN: [technician, 'ticket:read', 'ticket:work', 'asset:read'],
  IT_ADMIN: [
    admin,
    'ticket:read',
    'ticket:manage',
    'ticket:create',
    'ticket:close',
    'ticket:work',
  ],
};
const make = (id, title, state = 1) => ({
  ticket_id: id,
  number: String(11000 + id),
  title,
  state_id: state,
  priority_id: 2,
  created_at: timestamp,
  updated_at: timestamp,
});
let ticket = make(323, 'Sensor inspection');
let bodyCalls = [];
const requests = [];
const notificationId = '77777777-7777-4777-8777-777777777777';
const notificationReads = new Set();
let notificationAvailable = false;
let createConflict = true;
let articleRefresh = true;
const articles = [];
let assetLinks = [];
let assigned = true;
let ownerMatches = true;
let linkFailure = false;
let priorityFailure = true;
let directoryFailure = true;
let archived = false;
let archiveReason = '';
const archiveView = () => ({
  ticket_id: 323,
  archived,
  version: archived ? 1 : 2,
  archived_at: timestamp,
  archive_reason: archiveReason,
});
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAQAY3YkAAAAASUVORK5CYII=',
  'base64'
);
const pdf = Buffer.from('%PDF-1.4\nfixture\n%%EOF\n');
const fileIds = [
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
];
const fixtures = [];
let staging = null;
const problem = (status, code, detail) => ({
  status,
  contentType: 'application/problem+json',
  body: JSON.stringify({
    status,
    code,
    detail,
    title: code,
    type: 'about:blank',
    instance: '/api/v1/tickets',
    request_id: 'preview-check',
  }),
});
const payload = (data, status = 200) => ({
  status,
  json: { data, meta: { request_id: 'preview-check' } },
});
const paged = (data, next = null) => ({
  json: {
    ...payload(data).json,
    pagination: { type: 'cursor', next_cursor: next },
  },
});
async function session(browser, role) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Bangkok',
  });
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith('/api/v1/')) return route.continue();
    const p = url.pathname;
    const method = request.method();
    const params = url.searchParams;
    const input =
      request.postData() && method !== 'PUT'
        ? request.postDataJSON()
        : undefined;
    const headers = request.headers();
    requests.push({ method, p, query: Object.fromEntries(params), role });
    if (p.endsWith('/auth/browser/login')) {
      assert.deepEqual(input, {
        identifier: role.toLowerCase(),
        password: 'fixture-password',
      });
      return route.fulfill(
        payload({
          access_token: role + '-fixture',
          csrf_token: role + '-csrf',
          must_change_password: false,
        })
      );
    }
    if (p.endsWith('/auth/browser/refresh')) {
      assert.equal(headers['x-csrf-token'], role + '-csrf');
      return route.fulfill(
        payload({
          access_token: role + '-new-fixture',
          csrf_token: role + '-new-csrf',
        })
      );
    }
    if (p === '/api/v1/auth/me') {
      assert.ok(headers.authorization?.startsWith('Bearer ' + role + '-'));
      const [user_id, ...effective_permissions] = roles[role];
      return route.fulfill(
        payload({
          user_id,
          username: role.toLowerCase(),
          email: role.toLowerCase() + '@example.test',
          display_name: role,
          role,
          status: 'ACTIVE',
          effective_permissions,
          must_change_password: false,
        })
      );
    }
    assert.ok(headers.authorization?.startsWith('Bearer ' + role + '-'));
    assert.equal(headers['x-request-id'], undefined);
    if (p.startsWith('/api/v1/ticket-notifications')) {
      if (role === 'IT_ADMIN')
        return route.fulfill(problem(403, 'TICKET_DENIED', 'Inbox denied'));
      if (p.endsWith('/read')) {
        assert.equal(method, 'POST');
        assert.deepEqual(input, { ids: [notificationId] });
        const updated_count = notificationReads.has(role) ? 0 : 1;
        notificationReads.add(role);
        return route.fulfill(payload({ updated_count }));
      }
      assert.equal(method, 'GET');
      if (!notificationAvailable)
        return route.fulfill(payload({ items: [], unread_count: 0 }));
      const read = notificationReads.has(role);
      return route.fulfill(
        payload({
          items: [
            {
              id: notificationId,
              kind: 'responsibilities_changed',
              ticket_id: 323,
              ticket_number: '11323',
              ticket_title: 'Sensor inspection',
              occurred_at: timestamp,
              read,
            },
          ],
          unread_count: read ? 0 : 1,
        })
      );
    }

    if (p === '/api/v1/tickets/metadata/priorities' && priorityFailure)
      return route.fulfill({
        status: 503,
        json: { message: 'Priority unavailable' },
      });
    if (p === '/api/v1/tickets/metadata/priorities')
      return route.fulfill(
        payload([
          { id: 1, label: 'Low', color: 'green' },
          { id: 2, label: 'Normal', color: 'cyan' },
          { id: 3, label: 'High', color: 'amber' },
        ])
      );
    if (p === '/api/v1/tickets/archived') {
      if (role !== 'OPERATOR')
        return route.fulfill(problem(403, 'TICKET_DENIED', 'Archive denied'));
      return route.fulfill(
        paged(archived ? [{ ...ticket, archive: archiveView() }] : [])
      );
    }
    if (
      p === '/api/v1/tickets/323/archive' ||
      p === '/api/v1/tickets/323/restore'
    ) {
      if (role !== 'OPERATOR')
        return route.fulfill(problem(403, 'TICKET_DENIED', 'Archive denied'));
      assert.match(headers['idempotency-key'], /^[a-z0-9-]{36}$/);
      archived = p.endsWith('/archive');
      archiveReason = archived ? input.reason : archiveReason;
      return route.fulfill(payload(archiveView()));
    }
    if (p.startsWith('/api/v1/tickets/323/evidence')) {
      if ((archived || !assigned) && role === 'TECHNICIAN')
        return route.fulfill(
          problem(404, 'TICKET_NOT_FOUND', 'Ticket unavailable')
        );
      const path = p.slice('/api/v1/tickets/323/evidence'.length);
      if (!path)
        return route.fulfill(
          payload({
            upload_available: !archived,
            items: fixtures.map((item) => item.meta),
            next_cursor: null,
          })
        );
      if (path === '/uploads' && method === 'POST') {
        assert.equal(archived, false);
        staging = { desc: input };
        return route.fulfill(
          payload(
            {
              grant: 'synthetic-upload-grant',
              expires_at: new Date(Date.now() + 600000).toISOString(),
            },
            201
          )
        );
      }
      if (path === '/uploads' && method === 'PUT') {
        assert.ok(staging);
        assert.equal(headers['x-evidence-grant'], 'synthetic-upload-grant');
        staging.bytes = request.postDataBuffer();
        assert.equal(staging.bytes.length, staging.desc.file_size);
        return route.fulfill(payload({ upload_id: fileIds[fixtures.length] }));
      }
      if (path === '/finalize') {
        assert.match(headers['idempotency-key'], /^[a-z0-9-]{36}$/);
        assert.equal(input.grant, 'synthetic-upload-grant');
        assert.ok(staging?.bytes);
        const meta = {
          ...staging.desc,
          id: fileIds[fixtures.length],
          created_at: timestamp,
        };
        fixtures.push({ meta, bytes: staging.bytes });
        return route.fulfill(payload(meta, 201));
      }
      if (path.endsWith('/access')) {
        return route.fulfill(
          payload({
            grant: 'synthetic-read-' + input.disposition,
            expires_at: new Date(Date.now() + 60000).toISOString(),
          })
        );
      }
      if (path.endsWith('/content')) {
        assert.match(input.grant, /^synthetic-read-(inline|attachment)$/);
        const item = fixtures.find((it) => path.includes(it.meta.id));
        assert.ok(item);
        if (input.grant.endsWith('inline'))
          assert.match(item.meta.mime_type, /^image\//);
        return route.fulfill({
          status: 200,
          contentType: item.meta.mime_type,
          body: item.bytes,
        });
      }
    }
    if (p === '/api/v1/tickets/eligible-users') {
      assert.equal(role, 'OPERATOR');
      if (directoryFailure)
        return route.fulfill({
          status: 503,
          json: { message: 'Directory unavailable' },
        });
      const results = [
        {
          id: operator,
          username: 'operator',
          display_name: 'Preview Operator',
          role: 'OPERATOR',
          status: 'ACTIVE',
        },
        {
          id: technician,
          username: 'technician',
          display_name: 'Preview Technician',
          role: 'TECHNICIAN',
          status: 'ACTIVE',
        },
      ];
      const search = (params.get('search') ?? '').toLowerCase();
      return route.fulfill(
        paged(
          results.filter((result) =>
            result.display_name.toLowerCase().includes(search)
          )
        )
      );
    }
    if (p === '/api/v1/asset-topology/assets/' + asset)
      return route.fulfill(
        payload({
          id: asset,
          name: 'Rack sensor',
          asset_type: 'NODE',
          lifecycle_state: 'ACTIVE',
        })
      );
    if (p === '/api/v1/asset-topology/assets')
      return route.fulfill(
        paged([
          {
            id: asset,
            name: 'Rack sensor',
            asset_type: 'NODE',
            lifecycle_state: 'ACTIVE',
          },
        ])
      );
    if (p === '/api/v1/tickets') {
      if (method === 'GET') {
        if (archived) return route.fulfill(paged([]));
        if (role === 'TECHNICIAN' && params.has('assignee_user_id'))
          assert.equal(params.get('assignee_user_id'), technician);
        const ownerMatch =
          !params.has('business_owner_user_id') || ownerMatches;
        if (
          params.get('search') === 'No matches' ||
          !ownerMatch ||
          (!assigned && role === 'TECHNICIAN')
        )
          return route.fulfill(paged([]));
        if (params.get('cursor') === 'page2')
          return route.fulfill(paged([make(324, 'Closed inspection', 4)]));
        return route.fulfill(
          paged([ticket], params.has('business_owner_user_id') ? null : 'page2')
        );
      }
      assert.match(headers['idempotency-key'], /^[a-z0-9-]{36}$/);
      bodyCalls.push({ p, body: input, key: headers['idempotency-key'] });
      if (createConflict) {
        createConflict = false;
        return route.fulfill(
          problem(409, 'TICKET_UNRESOLVED', 'Unresolved fixture')
        );
      }
      return route.fulfill(payload(ticket, 201));
    }
    const match = /^\/api\/v1\/tickets\/323(?:\/(.*))?$/.exec(p);
    if (!match)
      return route.fulfill(problem(404, 'NOT_FOUND', 'Ticket unavailable'));
    const action = match[1] ?? '';
    if (archived)
      return route.fulfill(
        problem(404, 'TICKET_NOT_FOUND', 'Ticket unavailable')
      );
    if (role === 'TECHNICIAN' && !assigned)
      return route.fulfill(problem(404, 'NOT_FOUND', 'Ticket unavailable'));
    if (method === 'GET') {
      if (action === 'articles') return route.fulfill(paged(articles));
      if (action === 'links')
        return route.fulfill(
          linkFailure
            ? problem(503, 'TICKET_UNAVAILABLE', 'Dependency unavailable')
            : payload({
                incident_id: null,
                asset_ids: assetLinks,
                maintenance_activity_ids: [],
              })
        );
      return route.fulfill(payload(ticket));
    }
    assert.match(headers['idempotency-key'], /^[a-z0-9-]{36}$/);
    bodyCalls.push({ p, body: input, key: headers['idempotency-key'] });
    if (action === 'responsibilities')
      assert.deepEqual(input, { assignee_user_id: technician });
    if (action === 'links') {
      assetLinks = input.asset_ids;
      return route.fulfill(
        payload({
          incident_id: null,
          asset_ids: assetLinks,
          maintenance_activity_ids: [],
        })
      );
    }
    if (action === 'status') {
      ticket = { ...ticket, state_id: input.state === 'PENDING' ? 3 : 2 };
    }
    if (action === 'articles') {
      if (articleRefresh) {
        articleRefresh = false;
        return route.fulfill(
          problem(401, 'TOKEN_EXPIRED', 'Fixture requires refresh')
        );
      }
      assert.equal(headers.authorization, 'Bearer TECHNICIAN-new-fixture');
      articles.push({
        article_id: 88,
        type: 'note',
        internal: true,
        body_text: input.body,
        created_at: timestamp,
      });
      return route.fulfill(payload({ ticket_id: 323, article_id: 88 }, 201));
    }
    if (action === 'close') ticket = { ...ticket, state_id: 4 };
    if (action === 'reopen') ticket = { ...ticket, state_id: 2 };
    if (!action && input.title)
      ticket = {
        ...ticket,
        title: input.title,
        priority_id: input.priority_id ?? ticket.priority_id,
      };
    return route.fulfill(payload(ticket));
  });
  const page = await context.newPage();
  await signIn(page, role);
  return { context, page };
}
async function signIn(page, role) {
  await page.goto(origin + '/login', { timeout: 120000 });
  await page.locator('input[name="email"]').fill(role.toLowerCase());
  await page.locator('input[name="password"]').fill('fixture-password');
  await page.getByRole('button', { name: /sign in/i }).click();
}
async function seen(locator) {
  await locator.first().waitFor({ timeout: 25000 });
}
async function click(page, label) {
  await page
    .getByRole('button', { name: label, exact: true })
    .click({ timeout: 25000 });
}
async function dialog(page, label) {
  await click(page, label);
  const dlg = page.getByRole('dialog');
  await seen(dlg);
  return dlg;
}
const snapshot = (page, name) =>
  output
    ? page.screenshot({ path: join(output, name), animations: 'disabled' })
    : Promise.resolve();
(async () => {
  const browser = await chromium.launch({
    channel: process.env.WF04_BROWSER_CHANNEL ?? 'msedge',
    headless: true,
  });
  try {
    const op = await session(browser, 'OPERATOR');
    await seen(op.page.getByRole('heading', { name: 'Ticket Management' }));
    await seen(op.page.getByText('Sensor inspection', { exact: true }));
    const bell = op.page.getByLabel('Ticket notifications', { exact: true });
    await seen(bell.getByText('Notifications', { exact: true }));
    const notificationResponse = (response) =>
      response.url() === origin + '/api/v1/ticket-notifications' &&
      response.request().method() === 'GET' &&
      response.ok();
    await Promise.all([
      op.page.waitForResponse(notificationResponse),
      bell.click(),
    ]);
    await seen(op.page.getByText('No notifications for your account yet.'));
    notificationAvailable = true;
    await Promise.all([
      op.page.waitForResponse(notificationResponse),
      op.page.evaluate(() =>
        window.dispatchEvent(new Event('visibilitychange'))
      ),
    ]);
    await seen(
      op.page.getByLabel('Ticket notifications, 1 unread', { exact: true })
    );
    const notification = op.page.getByRole('link', {
      name: /Assignment updated/,
    });
    await seen(notification);
    assert.equal(await notification.getAttribute('href'), '/tickets/323');
    await click(op.page, 'Mark shown read');
    const readBell = op.page.getByLabel('Ticket notifications', {
      exact: true,
    });
    await seen(readBell);
    await readBell.click();
    await readBell.click();
    await seen(notification.getByLabel('Read', { exact: true }));
    await seen(op.page.getByText('0 unread', { exact: true }));
    await readBell.click();
    await snapshot(op.page, 'wf04-restored-list.png');
    await op.page
      .getByRole('button', { name: /Quick view Ticket/ })
      .first()
      .click();
    await seen(
      op.page
        .getByRole('dialog')
        .getByRole('link', { name: 'Open full Ticket' })
    );
    await snapshot(op.page, 'wf04-restored-quick-view.png');
    await op.page.keyboard.press('Escape');
    await click(op.page, 'Load more');
    await seen(op.page.getByText('Closed inspection', { exact: true }));
    await op.page.getByLabel('Search titles').fill('No matches');
    await click(op.page, 'Apply filters');
    await seen(op.page.getByRole('heading', { name: 'No Tickets found' }));
    await click(op.page, 'Reset');
    await seen(op.page.getByText('Sensor inspection', { exact: true }));
    const create = await dialog(op.page, 'Create Ticket');

    await seen(
      create.getByText('Priority catalog unavailable.', { exact: false })
    );
    await seen(
      create
        .getByText('Could not load eligible users.', { exact: false })
        .first()
    );
    await snapshot(op.page, 'wf04-picker-retry.png');
    priorityFailure = false;
    directoryFailure = false;
    await create
      .getByRole('button', { name: 'Retry', exact: true })
      .first()
      .click();
    if (
      await create
        .getByText('Could not load eligible users.', { exact: false })
        .count()
    )
      await create
        .getByText('Could not load eligible users.', { exact: false })
        .first()
        .getByRole('button', { name: 'Retry' })
        .click();
    await create.getByLabel(/^Title/).fill('Sensor inspection');
    await create.getByLabel(/^Description/).fill('Check cabling.');
    await create.getByRole('radio', { name: 'Normal' }).check();
    await create
      .getByLabel('Search Business Owner directory')
      .fill('Preview Operator');
    await create.getByLabel('Select Business Owner').selectOption(operator);
    await create
      .getByLabel('Search Assignee directory')
      .fill('Preview Technician');
    await create.getByLabel('Select Assignee').selectOption(technician);
    const preview = create.getByRole('complementary', {
      name: 'Ticket preview',
    });
    await seen(preview.getByText('Preview Operator', { exact: true }));
    await seen(preview.getByText('Preview Technician', { exact: true }));
    await seen(preview.getByText('Normal', { exact: true }));
    assert.equal(
      await create.getByRole('textbox', { name: /uuid/i }).count(),
      0
    );
    assert.ok(
      requests.some(
        (r) =>
          r.p === '/api/v1/tickets/eligible-users' &&
          r.query.search === 'Preview Technician'
      )
    );
    await seen(
      create
        .getByRole('complementary', { name: 'Ticket preview' })
        .getByText('Sensor inspection', { exact: true })
    );
    await snapshot(op.page, 'wf04-restored-create.png');
    await click(create, 'Create Ticket');
    await seen(create.getByRole('button', { name: 'Retry same request' }));
    await op.page.reload();
    await op.page.waitForURL('**/login');
    await signIn(op.page, 'OPERATOR');
    const saved = await dialog(op.page, 'Create Ticket');
    await click(saved, 'Retry same request');
    await op.page.waitForURL('**/tickets/323');
    await seen(op.page.getByRole('heading', { name: 'Sensor inspection' }));
    const creates = bodyCalls.filter((call) => call.p === '/api/v1/tickets');
    assert.equal(creates.length, 2);
    assert.deepEqual(creates[0], creates[1]);
    assert.deepEqual(creates[0].body, {
      title: 'Sensor inspection',
      description: 'Check cabling.',
      priority_id: 2,
      business_owner_user_id: operator,
      assignee_user_id: technician,
    });
    let next = await dialog(op.page, 'Change responsibilities');
    await next.getByLabel('Select Assignee').selectOption(technician);
    await snapshot(op.page, 'wf04-restored-responsibilities.png');
    await click(next, 'Change responsibilities');
    await next.waitFor({ state: 'hidden' });
    next = await dialog(op.page, 'Edit information');
    await next.getByLabel(/^Title/).fill('Sensor inspection updated');
    await next.locator('input[name="priority_id"][value="3"]').check();
    await click(next, 'Edit information');
    await next.waitFor({ state: 'hidden' });
    await seen(
      op.page.getByRole('heading', { name: 'Sensor inspection updated' })
    );
    next = await dialog(op.page, 'Edit Asset links');
    await click(next, 'Choose Assets');
    await next.getByLabel('Add related Asset').selectOption(asset);
    await snapshot(op.page, 'wf04-restored-asset-picker.png');
    await click(next, 'Edit Asset links');
    await next.waitFor({ state: 'hidden' });
    await seen(op.page.getByText('Rack sensor', { exact: true }));
    await op.page
      .locator('.ticket-readable')
      .first()
      .evaluate((element) => {
        element.scrollTop = 0;
      });
    await snapshot(op.page, 'wf04-restored-operator-detail.png');
    const tech = await session(browser, 'TECHNICIAN');
    await seen(tech.page.getByRole('heading', { name: 'My Tickets' }));
    await seen(tech.page.getByText('Assigned to you', { exact: true }).first());
    await snapshot(tech.page, 'wf04-restored-technician-list.png');
    await seen(
      tech.page.getByText('Sensor inspection updated', { exact: true })
    );
    assert.ok(
      requests.some(
        (r) =>
          r.role === 'TECHNICIAN' && r.query.assignee_user_id === technician
      )
    );
    await tech.page
      .getByRole('link', { name: /Sensor inspection updated/ })
      .click();
    await seen(
      tech.page.getByRole('heading', { name: 'Sensor inspection updated' })
    );
    assert.equal(
      await tech.page
        .getByRole('button', { name: 'Change responsibilities' })
        .count(),
      0
    );
    next = await dialog(tech.page, 'Update progress');
    await click(next, 'Update progress');
    await next.waitFor({ state: 'hidden' });
    next = await dialog(tech.page, 'Update progress');
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    await next.getByLabel(/Pending until/).fill(future);
    await click(next, 'Update progress');
    await next.waitFor({ state: 'hidden' });
    next = await dialog(tech.page, 'Update progress');
    await click(next, 'Update progress');
    await next.waitFor({ state: 'hidden' });
    next = await dialog(tech.page, 'Add internal note');
    await next.getByLabel(/^Internal note/).fill('<strong>plain text</strong>');
    await click(next, 'Add internal note');
    await next.waitFor({ state: 'hidden' });
    await seen(
      tech.page.getByText('<strong>plain text</strong>', { exact: true })
    );
    const appends = bodyCalls.filter((c) => c.p.endsWith('/articles'));
    assert.equal(appends.length, 2);
    assert.deepEqual(appends[0], appends[1]);
    assert.equal(articles.length, 1);
    await tech.page
      .locator('.ticket-readable')
      .first()
      .evaluate((element) => {
        element.scrollTop = 0;
      });
    await snapshot(tech.page, 'wf04-restored-articles.png');
    await tech.page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await tech.page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    );
    await tech.page
      .locator('.ticket-readable')
      .first()
      .evaluate((element) => {
        element.scrollTop = 0;
      });
    await snapshot(tech.page, 'wf04-restored-technician-narrow.png');
    await tech.page.setViewportSize({ width: 1440, height: 1000 });
    assigned = false;
    await click(tech.page, 'Refresh Ticket');
    await seen(tech.page.getByText(/Ticket not found or no longer accessible/));
    ownerMatches = false;
    const before = requests.length;
    await click(op.page, 'Refresh Ticket');
    await op.page.getByRole('button', { name: 'Refresh Ticket' }).waitFor();
    await op.page.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent === 'Refresh Ticket'
        )?.disabled
    );
    assert.ok(
      requests
        .slice(before)
        .some((r) => r.query.business_owner_user_id === operator)
    );
    assert.equal(
      await op.page
        .getByRole('button', { name: 'Close Ticket', exact: true })
        .count(),
      0
    );
    ownerMatches = true;
    await click(op.page, 'Refresh Ticket');
    next = await dialog(op.page, 'Close Ticket');
    await next.getByLabel(/^Outcome/).fill('Resolved and verified.');
    await click(next, 'Close Ticket');
    await next.waitFor({ state: 'hidden' });
    next = await dialog(op.page, 'Reopen Ticket');
    await next.getByLabel(/^Reason/).fill('Alarm recurred.');
    await click(next, 'Reopen Ticket');
    await next.waitFor({ state: 'hidden' });
    await seen(
      op.page.getByText('<strong>plain text</strong>', { exact: true })
    );
    assert.equal(ticket.ticket_id, 323);
    assert.equal(ticket.state_id, 2);

    await op.page.getByLabel('Choose Evidence file').setInputFiles({
      name: 'rack-photo.png',
      mimeType: 'image/png',
      buffer: png,
    });
    await click(op.page, 'Upload Evidence');
    await seen(op.page.getByText('rack-photo.png', { exact: true }));
    await click(op.page, 'Preview');
    await seen(
      op.page.getByRole('dialog').getByRole('img', { name: 'rack-photo.png' })
    );
    await snapshot(op.page, 'wf04-evidence-image-preview.png');
    await op.page.keyboard.press('Escape');
    await op.page.getByLabel('Choose Evidence file').setInputFiles({
      name: 'rack-report.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    });
    await click(op.page, 'Upload Evidence');
    await seen(op.page.getByText('rack-report.pdf', { exact: true }));
    await op.page
      .getByText('rack-report.pdf', { exact: true })
      .scrollIntoViewIfNeeded();
    await snapshot(op.page, 'wf04-evidence-gallery.png');
    const downloadPromise = op.page.waitForEvent('download');
    await op.page
      .getByRole('listitem')
      .filter({ hasText: 'rack-report.pdf' })
      .getByRole('button', { name: 'Download', exact: true })
      .click();
    assert.equal(
      (await downloadPromise).suggestedFilename(),
      'rack-report.pdf'
    );
    const archiveDialog = await dialog(op.page, 'Move to Trash');
    await archiveDialog.getByLabel(/^Reason/).fill('Isolated test archive');
    await snapshot(op.page, 'wf04-archive-confirm.png');
    await click(archiveDialog, 'Move to Trash');
    await op.page.waitForURL('**/tickets?view=archived');
    await seen(op.page.getByText('Isolated test archive', { exact: true }));
    await snapshot(op.page, 'wf04-archived-list.png');
    await click(op.page, 'View Evidence');
    await seen(op.page.getByText('rack-report.pdf', { exact: true }));
    assert.equal(
      await op.page
        .getByRole('button', { name: 'Upload Evidence', exact: true })
        .count(),
      0
    );
    await op.page.getByRole('link', { name: 'Active workspace' }).click();
    await seen(op.page.getByRole('heading', { name: 'No Tickets found' }));
    await op.page.getByRole('link', { name: 'Archived Tickets' }).click();
    const restoreDialog = await dialog(op.page, 'Restore Ticket');
    await restoreDialog.getByLabel(/^Reason/).fill('Isolated test restore');
    await click(restoreDialog, 'Restore Ticket');
    await seen(
      op.page.getByText('No archived Tickets on the loaded pages.', {
        exact: true,
      })
    );
    await op.page.getByRole('link', { name: 'Active workspace' }).click();
    await op.page
      .getByRole('link', { name: /Sensor inspection updated/ })
      .click();
    await seen(op.page.getByText('rack-report.pdf', { exact: true }));
    assert.equal(ticket.ticket_id, 323);
    assert.equal(fixtures.length, 2);
    assert.equal(ticket.priority_id, 3);
    linkFailure = true;
    await click(op.page, 'Refresh Ticket');
    await seen(op.page.getByText(/required dependency is unavailable/));
    const withDirectory = await session(browser, 'OPERATOR');
    await withDirectory.page
      .getByLabel('Priority', { exact: true })
      .selectOption({ label: 'Normal' });
    const filtered = withDirectory.page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === '/api/v1/tickets' &&
        url.searchParams.get('priority_id') === '2'
      );
    });
    await click(withDirectory.page, 'Apply filters');
    await filtered;
    assert.equal(
      requests.some((r) => r.p === '/api/v1/users'),
      false
    );
    const selection = await dialog(withDirectory.page, 'Create Ticket');
    await selection
      .getByLabel('Search Assignee directory')
      .fill('Preview Technician');
    await selection.getByLabel('Select Assignee').selectOption(technician);
    await selection.getByLabel('Select Business Owner').selectOption(operator);
    await seen(
      selection
        .getByRole('complementary', { name: 'Ticket preview' })
        .getByText('Preview Technician', { exact: true })
    );
    await snapshot(withDirectory.page, 'wf04-restored-directory.png');
    await withDirectory.context.close();
    const it = await session(browser, 'IT_ADMIN');
    await seen(it.page.getByRole('link', { name: 'Monitoring' }));
    assert.equal(
      await it.page.getByRole('link', { name: 'Alerts & Tickets' }).count(),
      0
    );
    assert.equal(await it.page.getByLabel('Ticket notifications').count(), 0);
    assert.equal(
      requests.some(
        (r) =>
          r.role === 'IT_ADMIN' &&
          (r.p.startsWith('/api/v1/tickets') ||
            r.p.startsWith('/api/v1/ticket-notifications'))
      ),
      false
    );
    assert.equal(
      requests.some((r) =>
        /\/(events|assignment|comments|from-reviewed-draft)(\/|$)|\/evidence\/upload-url(\/|$)|\/api\/v1\/tickets\/me(\/|$)|\/api\/v1\/api\/v1/.test(
          r.p
        )
      ),
      false
    );
    console.log(
      'PASS Edge with fake Core: notification badge/read/link, list/cursor, create and same-key retry, edit, responsibilities, Asset links, Technician progress, Article 401/refresh and plain text, Evidence PNG/PDF and download, Archive/Restore, loss of access, Owner close, reopen, dependency error and IT Admin denial'
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
