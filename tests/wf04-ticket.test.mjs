import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND' || !specifier.startsWith('.'))
        throw error;
      return next(specifier + '.ts', context);
    }
  },
});

const { ticketInputs, ticketListSchema, cursorDto } =
  await import('../src/types/ticket.ts');
const {
  mapArticle,
  mapTicket,
  mapLinks,
  nextProgress,
  parseStateIds,
  ticketQuery,
} = await import('../src/services/tickets/ticket-contract.ts');
const { newOperation, operationRecord, isDefinitiveFailure, ticketError } =
  await import('../src/services/tickets/ticket-operation.ts');
const { coreOrigin } = await import('../src/lib/http/core-origin.ts');
const { ticketAccess, ticketHome } =
  await import('../src/lib/auth/ticket-access.ts');
const { ticketNotificationInbox } =
  await import('../src/services/tickets/ticket-notification-contract.ts');

test('decodes Ticket notification labels, actor unread counts and canonical link IDs', () => {
  const item = {
    id: 'f75c1084-8dcb-410a-8c75-e387cd3ef9d2',
    kind: 'responsibilities_changed',
    ticket_id: 42,
    ticket_number: '11042',
    ticket_title: 'Rack inspection',
    occurred_at: '2026-11-24T00:00:00Z',
    read: false,
  };
  const result = ticketNotificationInbox.parse({
    items: [item],
    unread_count: 1,
  });
  assert.equal(result.items[0].label, 'Assignment updated');
  assert.equal(result.items[0].ticket_id, 42);
  assert.throws(() =>
    ticketNotificationInbox.parse({ items: [item], unread_count: 0 })
  );
  assert.throws(() =>
    ticketNotificationInbox.parse({
      items: [{ ...item, kind: 'unknown' }],
      unread_count: 1,
    })
  );
});

const { mapCoreProfile } = await import('../src/services/auth/core-profile.ts');

const owner = '11111111-1111-4111-8111-111111111111';
const assignee = '22222222-2222-4222-8222-222222222222';
const timestamp = '2026-11-22T01:00:00.000Z';
const states = { NEW: 17, OPEN: 21, PENDING: 23, CLOSED: 42 };
const dto = {
  ticket_id: 16,
  number: 'TK-16',
  title: 'Sensor inspection',
  state_id: 21,
  priority_id: 7,
  created_at: timestamp,
  updated_at: timestamp,
};

test('map canonical Ticket fields and withhold unknown state actions', () => {
  assert.deepEqual(mapTicket(dto, states), {
    id: 16,
    number: 'TK-16',
    title: 'Sensor inspection',
    stateId: 21,
    state: 'OPEN',
    priorityId: 7,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  assert.equal(mapTicket(dto, null).state, null);
  assert.equal(parseStateIds(JSON.stringify({ ...states, NEW: 21 })), null);
  assert.throws(() => mapTicket({ ...dto, ticket_id: '16' }, states));
});

test('normalize Core origin and retain opaque cursor and scoped list filters', () => {
  assert.equal(
    coreOrigin('https://core.example.test/api/v1/'),
    'https://core.example.test'
  );
  assert.throws(() => coreOrigin('https://core.example.test/api/v1/tickets'));
  const query = ticketListSchema.parse({
    state: 'CLOSED',
    priority_id: 8,
    assignee_user_id: assignee,
    search: ' phòng máy ',
    page_size: 25,
  });
  const params = new URLSearchParams(
    ticketQuery({ ...query, cursor: 'opaque_Cursor-16' })
  );
  assert.equal(params.get('search'), 'phòng máy');
  assert.equal(params.get('cursor'), 'opaque_Cursor-16');
  assert.equal(params.get('assignee_user_id'), assignee);
  assert.equal(
    cursorDto.parse({ type: 'cursor', next_cursor: null }).next_cursor,
    null
  );
  assert.equal(ticketListSchema.safeParse({ search: 'rack-1' }).success, false);
});

test('manual create uses separate Core Owner and Assignee and disallows legacy or Incident fields', () => {
  const data = {
    title: ' Sensor inspection ',
    description: ' Check power. ',
    priority_id: 7,
    business_owner_user_id: owner,
    assignee_user_id: assignee,
  };
  const normalized = ticketInputs.create.parse(data);
  assert.deepEqual(normalized, {
    ...data,
    title: 'Sensor inspection',
    description: 'Check power.',
  });
  assert.equal(
    ticketInputs.create.safeParse({ ...data, incident_id: 'old-incident' })
      .success,
    false
  );
  assert.equal(
    ticketInputs.create.safeParse({ ...data, ticketCode: 'legacy' }).success,
    false
  );
  assert.equal(
    ticketInputs.create.safeParse({ ...data, business_owner_user_id: 'legacy' })
      .success,
    false
  );
  assert.deepEqual(
    ticketInputs.responsibilities.parse({ assignee_user_id: assignee }),
    { assignee_user_id: assignee }
  );
  assert.equal(ticketInputs.responsibilities.safeParse({}).success, false);
});

test('validate supported transitions and dedicated terminal operations', () => {
  assert.deepEqual(
    [
      nextProgress('NEW'),
      nextProgress('OPEN'),
      nextProgress('PENDING'),
      nextProgress('CLOSED'),
      nextProgress(null),
    ],
    ['OPEN', 'PENDING', 'OPEN', null, null]
  );
  assert.equal(
    ticketInputs.progress.safeParse({ state: 'PENDING' }).success,
    false
  );
  assert.equal(
    ticketInputs.progress.safeParse({ state: 'OPEN', pending_until: timestamp })
      .success,
    false
  );
  assert.equal(
    ticketInputs.progress.safeParse({ state: 'CLOSED' }).success,
    false
  );
  assert.equal(
    ticketInputs.progress.safeParse({
      state: 'PENDING',
      pending_until: timestamp,
    }).success,
    true
  );
  assert.deepEqual(ticketInputs.close.parse({ outcome: ' done ' }), {
    outcome: 'done',
  });
  assert.equal(ticketInputs.reopen.safeParse({ reason: ' ' }).success, false);
});

test('Article body remains plain text and links validate canonical Asset IDs', () => {
  const html = '<b>Do not interpret as HTML</b>';
  assert.deepEqual(ticketInputs.article.parse({ body: html }), { body: html });
  assert.deepEqual(
    mapArticle({
      article_id: 4,
      type: 'note',
      internal: true,
      body_text: html,
      created_at: timestamp,
    }),
    { id: 4, type: 'note', internal: true, body: html, createdAt: timestamp }
  );
  assert.equal(
    mapArticle({
      article_id: 5,
      type: 'note',
      internal: true,
      body_text: null,
      created_at: timestamp,
    }).body,
    null
  );
  assert.deepEqual(
    mapLinks({
      incident_id: null,
      asset_ids: [assignee],
      maintenance_activity_ids: [],
    }),
    { incidentId: null, assetIds: [assignee], maintenanceIds: [] }
  );
  assert.equal(
    ticketInputs.links.safeParse({ asset_ids: [assignee, assignee] }).success,
    false
  );
});

test('map Core IAM authority and keep IT Admin excluded even with Ticket permissions', () => {
  const me = (role, permissions) =>
    mapCoreProfile({
      user_id: owner,
      username: 'person',
      email: 'person@example.test',
      display_name: null,
      role,
      status: 'ACTIVE',
      effective_permissions: permissions,
      must_change_password: false,
    });
  const full = [
    'ticket:read',
    'ticket:create',
    'ticket:manage',
    'ticket:work',
    'ticket:close',
  ];
  const operator = me('OPERATOR', full);
  const tech = me('TECHNICIAN', ['ticket:read', 'ticket:work']);
  assert.equal(ticketHome(operator), '/tickets');
  assert.equal(ticketHome(tech), '/tickets/me');
  assert.equal(ticketHome(me('IT_ADMIN', full)), null);
  assert.equal(ticketAccess(tech).manage, false);
  assert.equal(ticketAccess(tech).close, false);
  assert.equal(ticketAccess(tech).reopen, false);
  assert.equal(ticketAccess(tech).work, true);
  assert.equal(ticketAccess({ ...operator, status: 'INACTIVE' }).read, false);
  assert.equal(
    ticketAccess({ ...operator, mustChangePassword: true }).read,
    false
  );
  assert.equal(
    ticketAccess({ ...operator, permissions: ['tickets.dispatch'] }).create,
    false
  );
});

test('saved operation retains its original normalized payload and key across serialization', () => {
  const record = newOperation('article', { body: '  checked  ' });
  const recovered = operationRecord.parse(JSON.parse(JSON.stringify(record)));
  assert.deepEqual(recovered, record);
  assert.deepEqual(recovered.payload, { body: 'checked' });
  assert.match(recovered.key, /^[a-zA-Z0-9_-]{16,128}$/);
  assert.notEqual(newOperation('article', { body: 'checked' }).key, record.key);
});

test('show non-disclosing errors and retain unresolved or dependency-failed operations', () => {
  assert.equal(isDefinitiveFailure({ status: 400 }), true);
  assert.equal(isDefinitiveFailure({ status: 404 }), false);
  assert.equal(
    isDefinitiveFailure({ status: 409, code: 'TICKET_UNRESOLVED' }),
    false
  );
  assert.equal(isDefinitiveFailure({ status: 503 }), false);
  assert.equal(
    ticketError({ status: 404, message: 'private provider' }),
    'Ticket not found or no longer accessible.'
  );
  assert.match(
    ticketError({
      status: 409,
      code: 'TICKET_UNRESOLVED',
      requestId: 'test-request',
    }),
    /Retry the same operation.*test-request/
  );
});

const { ticketPriority } =
  await import('../src/features/web-dashboard/tickets/lib/ticket-ui.ts');
test('priority color follows catalog metadata and unknown IDs remain neutral', () => {
  const catalog = [
    { id: 24, label: 'Low', color: 'green' },
    { id: 3, label: 'High', color: 'amber' },
  ];
  assert.equal(ticketPriority(24, catalog).label, 'Low');
  assert.equal(ticketPriority(24, catalog).tone, 'green');
  assert.equal(ticketPriority(3, catalog).tone, 'amber');
  assert.equal(ticketPriority(1, catalog).label, 'Unknown priority');
  assert.equal(ticketPriority(1, catalog).tone, 'neutral');
});
