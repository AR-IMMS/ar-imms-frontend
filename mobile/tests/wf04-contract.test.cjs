/* global __dirname:readonly */
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const { test, after, before } = require('node:test');
const { createServer } = require('node:http');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { mkdtempSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(join(tmpdir(), 'wf04-expo-contract-'));
const sourceRoot = join(__dirname, '..', 'src');
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--target', 'ES2022',
  '--module', 'node16', '--strict', '--skipLibCheck', '--rootDir', sourceRoot, '--outDir', output,
  ...['api/auth.ts', 'api/tickets.ts', 'api/evidence-contract.ts', 'notifications/ticket-notifications.ts'].map(file => join(sourceRoot, file))], { cwd: output, stdio: 'inherit' });
const { NativeSession } = require(join(output, 'api/auth.js'));
const { coreBase, localDeadline } = require(join(output, 'api/core-contract.js'));
const { listTickets, articles, nextAction, ticketView, post } = require(join(output, 'api/tickets.js'));

let base, server, handler;
before(async () => {
  server = createServer(async (req, res) => {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      const argument = req.headers['content-type'] === 'application/octet-stream' ? Buffer.concat(chunks) : raw ? JSON.parse(raw) : undefined;
      const result = await handler(req, argument);
      res.writeHead(result.status ?? 200, result.bytes ? { 'Content-Type': 'application/pdf', 'Content-Length': result.bytes.length } : { 'Content-Type': 'application/json' });
      res.end(result.bytes ?? (result.body === undefined ? undefined : JSON.stringify(result.body)));
    } catch { res.writeHead(500).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port + '/api/v1';
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  rmSync(output, { recursive: true, force: true });
});
const technicianId = 'b84a74b5-22ec-40c1-8cad-238ce10a14b3';
const goodProfile = {
  user_id: technicianId, status: 'ACTIVE', username: 'technician', email: 'tech@example.test',
  display_name: null, role: 'TECHNICIAN', effective_permissions: ['ticket:read', 'ticket:work'],
  must_change_password: false, presence_status: 'ONLINE', presence_preference: 'AUTOMATIC',
};
const pair = (access, refresh, change = false) => ({ access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: 900, must_change_password: change });
const item = { ticket_id: 123, number: '110123', title: 'Rack inspection', priority_id: 77, state_id: 21,
  created_at: '2026-11-23T00:00:00Z', updated_at: '2026-11-23T00:00:00Z' };
const map = JSON.stringify({ NEW: 20, OPEN: 21, PENDING: 22, CLOSED: 23 });
const color = [{id:77,label:'High',color:'amber'}];
const data = (body, status = 200) => ({body:{data:body},status});
const failure = status => ({status,body:{code:'DENIED'}});
function fixture(initial = null) {
  let stored = initial, invalidations = 0;
  const client = new NativeSession(base, {
    read: async () => stored, save: async token => { stored = token; }, clear: async () => { stored = null; },
  }, () => invalidations++);
  return { client, stored: () => stored, invalidations: () => invalidations };
}

test('native login and concurrent HTTP 401 rotate once; retries keep the same operation key and payload', async () => {
  const { client, stored } = fixture();
  let rotation = 0;
  const writes = [];
  handler = async (req, body) => {
    if (req.url.endsWith('/auth/login')) {
      assert.deepEqual(body,{identifier:'technician',password:'fixture-only'});
      return data(pair('first-access','first-refresh'));
    }
    if (req.url.endsWith('/auth/me')) return data(goodProfile);
    if (req.url.endsWith('/auth/refresh')) {
      rotation++;
      assert.deepEqual(body,{refresh_token:'first-refresh'});
      return data(pair('second-access','second-refresh'));
    }
    writes.push({ auth:req.headers.authorization, key:req.headers['idempotency-key'], body });
    return req.headers.authorization === 'Bearer first-access' ? failure(401) : data(item);
  };
  const { user } = await client.login('technician', 'fixture-only');
  assert.equal(user.id, technicianId);
  assert.equal(user.userId, technicianId);
  await Promise.all([
    client.request('/tickets/123/status',post({state:'OPEN'},'test-unique-key-111')),
    client.request('/tickets/123/status',post({state:'OPEN'},'test-unique-key-222')),
  ]);
  assert.equal(rotation,1);
  assert.equal(stored(),'second-refresh');
  assert.equal(writes.length,4);
  for(const key of ['test-unique-key-111','test-unique-key-222']) {
    assert.deepEqual(writes.filter(write=>write.key===key).map(write=>write.body),[{state:'OPEN'},{state:'OPEN'}]);
  }
});

test('restores a valid native session, verifies IAM, then revokes it with a bearer logout', async () => {
  const { client, stored } = fixture('existing-refresh');
  handler = (req, body) => {
    if (req.url.endsWith('/refresh')) {
      assert.equal(body.refresh_token,'existing-refresh'); return data(pair('rotated','next-refresh'));
    }
    if (req.url.endsWith('/me')) return data(goodProfile);
    assert.equal(req.url,'/api/v1/auth/logout');
    assert.equal(req.headers.authorization,'Bearer rotated');
    return { status:204 };
  };
  assert.equal((await client.restore()).user.roles[0], 'TECHNICIAN');
  assert.equal(stored(),'next-refresh');
  await client.logout();
  assert.equal(stored(),null);
});

test('first-use password change gates profile calls and requires fresh login', async () => {
  const { client, stored } = fixture();
  const paths = [];
  handler = (req, body) => {
    paths.push(req.url);
    if (req.url.endsWith('/login')) return data(pair('temporary','refresh',true));
    assert.deepEqual(body,{new_password:'fixture-new-password'});
    assert.equal(req.headers.authorization,'Bearer temporary');
    return data({changed:true});
  };
  const identity=await client.login('technician','fixture-only');
  assert.deepEqual(identity,{user:null,change:true});
  await client.changePassword('fixture-new-password');
  assert.deepEqual(paths,['/api/v1/auth/login','/api/v1/auth/change-password']);
  assert.equal(stored(),null);
});

test('rejects non-Technician and clears revoked refresh credentials', async () => {
  const wrong = fixture();
  handler = (req) => req.url.endsWith('/login') ? data(pair('a','r')) : req.url.endsWith('/me') ?
    data({...goodProfile,role:'OPERATOR'}) : {status:204};
  await assert.rejects(wrong.client.login('operator','fixture-only'),{status:403});
  assert.equal(wrong.stored(),null);
  const invalid = fixture('bad-refresh');
  handler = () => failure(401);
  await assert.rejects(invalid.client.restore(),{status:401});
  assert.equal(invalid.stored(),null);
});

test('passes scoped assignee, discovered priority and opaque cursor and reads internal Articles only', async () => {
  const { client } = fixture();
  handler = req => {
    if(req.url.endsWith('/login'))return data(pair('a','r'));
    if(req.url.endsWith('/me'))return data(goodProfile);
    const url = new URL(req.url,base);
    if (url.pathname.endsWith('/articles')) return { body:{data:[{internal:false,article_id:1},{internal:true,article_id:2,body_text:'Checked power',created_at:item.created_at}],pagination:{type:'cursor',next_cursor:'forward'}} };
    assert.equal(url.searchParams.get('assignee_user_id'), technicianId);
    assert.equal(url.searchParams.get('priority_id'),'77');
    assert.equal(url.searchParams.get('cursor'),'opaque==?');
    assert.equal(url.searchParams.get('search'),'rack test');
    return {body:{data:[item],pagination:{type:'cursor',next_cursor:'next'}}};
  };
  const { user } = await client.login('technician', 'fixture-only');
  const page=await listTickets(client,user.id,color,map,{priority:77,cursor:'opaque==?',search:'rack test'});
  assert.equal(page.items[0].ticketCode,'110123');
  assert.equal(page.items[0].priority,'High');
  assert.equal(page.nextCursor,'next');
  const notes=await articles(client,'123');
  assert.deepEqual(notes.items.map(note=>note.id),[2]);
  assert.equal(notes.nextCursor,'forward');
});

test('derives safe state actions, unknown styles and valid offset-bearing local deadlines', () => {
  assert.equal(ticketView(item,[],undefined).status,'UNKNOWN');
  assert.equal(ticketView(item,[],map).priorityColor,'neutral');
  assert.equal(nextAction('NEW').target,'OPEN');
  assert.equal(nextAction('OPEN').target,'PENDING');
  assert.equal(nextAction('PENDING').target,'OPEN');
  assert.equal(nextAction('CLOSED'),null);
  assert.match(localDeadline('2099-02-28 10:30'), /T10:30:00[+-][0-9]{2}:[0-9]{2}$/);
  assert.throws(()=>localDeadline('2099-02-30 10:30'));
  assert.equal(coreBase('http://10.0.2.2:8082'),'http://10.0.2.2:8082/api/v1');
  assert.throws(()=>coreBase('http://example.invalid'));
  assert.throws(()=>coreBase('https://example.invalid/api/v1/auth'));
});

test('uses the authenticated Core inbox and persists read acknowledgements on the API', async () => {
  const { decodeTicketNotifications, fetchTicketNotifications, readTicketNotifications } = require(join(output, 'notifications/ticket-notifications.js'));
  const { client } = fixture();
  const id = 'f75c1084-8dcb-410a-8c75-e387cd3ef9d2';
  const row = { id, kind: 'article_added', ticket_id: 42, ticket_number: '11042', ticket_title: 'Rack inspection', occurred_at: '2026-11-24T00:00:00Z', read: false };
  handler = (req, body) => {
    if (req.url.endsWith('/auth/login')) return data(pair('account','refresh'));
    if (req.url.endsWith('/auth/me')) return data(goodProfile);
    assert.equal(req.headers.authorization, 'Bearer account');
    if (req.url.endsWith('/ticket-notifications/read')) {
      assert.equal(req.method, 'POST');
      assert.deepEqual(body, { ids: [id] });
      const count = row.read ? 0 : 1;
      row.read = true;
      return data({ updated_count: count });
    }
    assert.equal(req.url, '/api/v1/ticket-notifications');
    return data({ items: [row], unread_count: row.read ? 0 : 1 });
  };
  await client.login('technician','fixture-only');
  assert.equal((await fetchTicketNotifications(client)).items[0].title, 'New Ticket note');
  await readTicketNotifications(client, [id]);
  await readTicketNotifications(client, [id]);
  const inbox = await fetchTicketNotifications(client);
  assert.equal(inbox.unreadCount, 0);
  assert.equal(inbox.items[0].read, true);
  assert.throws(() => decodeTicketNotifications({ items: [row], unread_count: 1 }));
});

test('Evidence uses scoped grants, raw binary upload, finalize key and protected content bytes', async () => {
  const { client } = fixture();
  const { authorizeEvidenceUpload, evidenceUploadHeaders, evidenceBytes } = require(join(output, 'api/evidence-contract.js'));
  const payload=Buffer.from('synthetic PDF');
  const id='91c353a7-345d-4ef4-a082-ee947c1978aa';
  const keyed='evidence-http-fixture-123';
  const base='/tickets/123/evidence';
  handler=(req,body)=>{
    if(req.url.endsWith('/auth/login'))return data(pair('a','r'));
    if(req.url.endsWith('/auth/me'))return data(goodProfile);
    assert.equal(req.headers.authorization,'Bearer a');
    if(req.url.endsWith('/uploads')&&req.method==='POST'){
      assert.deepEqual(body,{file_name:'fixture.pdf',mime_type:'application/pdf',file_size:payload.length});
      return data({grant:'private-upload-fixture',expires_at:'2099-01-01T00:00:00Z'},201);
    }
    if(req.url.endsWith('/uploads')&&req.method==='PUT'){
      assert.equal(req.headers['x-evidence-grant'],'private-upload-fixture');
      assert.deepEqual(body,payload);
      return data({upload_id:id});
    }
    if(req.url.endsWith('/finalize')){
      assert.equal(req.headers['idempotency-key'],keyed);
      assert.deepEqual(body,{grant:'private-upload-fixture'});
      return data({id},201);
    }
    if(req.url.endsWith('/access')){
      assert.deepEqual(body,{disposition:'attachment'});
      return data({grant:'private-read-fixture'});
    }
    assert.equal(req.url,'/api/v1'+base+'/'+id+'/content');
    assert.deepEqual(body,{grant:'private-read-fixture'});
    return {bytes:payload};
  };
  await client.login('technician','fixture-only');
  const {grant}=await authorizeEvidenceUpload(client,'123','fixture.pdf','application/pdf',payload.length);
  const upload=await client.request(base+'/uploads',{method:'PUT',body:new Uint8Array(payload),headers:evidenceUploadHeaders(grant)});
  assert.equal(upload.status,200);
  assert.equal((await client.request(base+'/finalize',post({grant},keyed))).status,201);
  assert.deepEqual(await evidenceBytes(client,'123',id,payload.length,false),new Uint8Array(payload));
});
