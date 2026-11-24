# WF-04 Ticket frontend

The frontend follows the current Core Ticket contract on `feat/ticket-management`, including the reviewed local Archive, Evidence, Priority and eligible-user endpoints. The Web Dashboard bell and the Field Mobile inbox use `GET /api/v1/ticket-notifications` and `POST /api/v1/ticket-notifications/read`. The signed-in Operator or Technician sees recent updates for Tickets they are eligible to read and for which they were a recipient. Core shares read state across both clients. Browsers call Core with an IAM bearer token. Zammad
access, identity mapping, resource authorization and Audit live in Core.

## Configuration

Use an ignored `.env.local` and rebuild or restart Next.js after changing values.
Only public URLs and state IDs belong in these settings.

```dotenv
NEXT_PUBLIC_TICKET_API_URL=https://core.example.test
NEXT_PUBLIC_CORE_BROWSER_AUTH=true
# Example for the verified PoC. Confirm the state catalog for your environment.
NEXT_PUBLIC_TICKET_STATE_IDS={"NEW":1,"OPEN":2,"PENDING":3,"CLOSED":4}
```

The URL can be an origin or that origin's `/api/v1` base. An empty URL uses
same-origin requests and requires an approved route to Core. Configure other
Dashboard services independently. Unknown state IDs appear as IDs and suppress
lifecycle actions. Priority IDs are internal request values. The UI reads active labels and colors from Core at `/api/v1/tickets/metadata/priorities`. Unknown priorities show a neutral badge. Create waits for the catalog, and title-only edits are available during a catalog outage.

Enable Core browser auth on an approved same-site HTTPS deployment. It uses
`/api/v1/auth/browser/{login,refresh,logout}` and `/api/v1/auth/me`. Access and CSRF
values remain in memory. Core sets the Secure, HttpOnly refresh cookie. A full
reload requires signing in again. Use provisioned accounts with first-login
password change completed through the approved IAM workflow.

## API coverage

Every path is relative to `/api/v1/tickets`. Workflow evidence below is from Edge with fake Core. The two new reads were verified through real HTTP on isolated Core with live Zammad and synthetic IAM accounts. Persistent PoC browser and staging E2E remain **NOT RUN**.

| Method and path | Integrated behavior | Evidence / limitation |
| --- | --- | --- |
| GET `/` | Scoped list, filters and cursor pagination | Mocked; no global totals |
| GET `/metadata/priorities` | Active environment catalog including ID, label and color | Live read against isolated new Core and configured Zammad |
| GET `/eligible-users` | Paged Ticket Owner/Assignee search for scoped Operators | Isolated new Core passed actual auth/HTTP with synthetic IAM and live Zammad eligibility |
| GET `/:id` | Canonical number, title, state, priority and timestamps | Mocked; missing and inaccessible share the same message |
| GET `/:id/articles` | Paginated chronological history | Mocked; text can be null, with no attachment or actor fields |
| GET `/:id/links` | Visible Asset, Incident and Maintenance references | Mocked; no inferred provider state |
| POST `/` | Manual create, then direct canonical detail | Mocked; no Incident input |
| PATCH `/:id` | Edit title and priority ID | Mocked; description editing unavailable |
| PATCH `/:id/responsibilities` | Update Owner or Assignee independently | Mocked; no current responsibility IDs in the detail DTO |
| POST `/:id/status` | NEW → OPEN, OPEN → PENDING, PENDING → OPEN | Mocked; PENDING requires a future deadline |
| POST `/:id/articles` | Append an internal note | Mocked including auth refresh; plain text only |
| PATCH `/:id/links` | Replace Asset links via the Core Asset directory | Mocked; Incident/Maintenance mutations unavailable |
| POST `/:id/close` | Current Business Owner close with outcome | Mocked; Core verifies owner and permission |
| POST `/:id/reopen` | Authorized reopen with reason | Mocked; requires CLOSED |
| POST `/from-reviewed-draft` | Unavailable | No request initiated; requires an Incident provider |

IT_ADMIN has no Ticket business access even with Ticket grants. Operator management,
Technician work and read controls use effective permissions. My Tickets uses either
the signed-in user's Assignee or Business Owner UUID. To offer closure, the
frontend confirms the exact canonical ID through a bounded, Owner-filtered Core
list. Search lag or the lookup bound can hide the action until refresh. Core
rechecks authority when processing the write.

Queue counters count only fetched rows. Quick view retrieves the selected Ticket and its visible Asset links on demand. The live creation preview reflects form input. Core assigns the canonical number after creation.

Owner and Assignee use separate searchable pickers backed by Core's scoped Ticket directory. Operator needs Ticket read/manage and a current mapping. Search uses the IAM display name and username, with pagination when the result has a continuation. Core validates both selected UUIDs at mutation time. Email is outside this directory contract. Both active mapped Operator and Technician roles are currently eligible for either field when their Zammad group access is valid. The Asset picker shows authorized, non-retired Assets. Archive is reversible. Legacy deletion and SSE integrations are inactive. Ticket refresh and cache invalidation use React Query.

## Retry behavior

The UI saves each normalized mutation payload and UUID operation key in the current
tab before sending. Storage is scoped to environment, actor, Ticket and action.
Writes have no automatic transport retry. A legitimate 401 refresh replays the
identical request once. To recover an unresolved operation, select **Retry same
request**. Signing back in after a reload in the same tab can resume that operation.
Keep the tab open and use the request ID with authorized support if still
unresolved. Closing the tab or clearing its storage can lose the local record.
Do not submit uncertain work with a new key.

## Verification

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit
pnpm.cmd build
pnpm.cmd test:ticket
```

For mock browser checks, start this frontend on a free port 3000 with the
following process-local environment. In a separate terminal supply the absolute
entry path of an external `playwright-core` installation and run the checked-in
test using installed Edge. The runner intercepts all Core calls and blocks
off-origin traffic. Its notification check covers the unread badge, opening the inbox, acknowledgement, and the canonical Ticket link. Use `WF04_BROWSER_OUTPUT` to save optional screenshots outside
the repository.

```powershell
$env:NEXT_PUBLIC_TICKET_API_URL='http://127.0.0.1:3000/api/v1'
$env:NEXT_PUBLIC_CORE_BROWSER_AUTH='true'
$env:NEXT_PUBLIC_TICKET_STATE_IDS='{"NEW":1,"OPEN":2,"PENDING":3,"CLOSED":4}'
pnpm.cmd dev --hostname 127.0.0.1 --port 3000
# Separate terminal
$env:WF04_PLAYWRIGHT_MODULE='<absolute path to playwright-core/index.js>'
node tests/wf04-ticket-browser.mjs
```

## Live acceptance still required

1. Obtain the approved Dashboard HTTPS origin and Core URL. Confirm the browser
   auth origin and preflight allow `Authorization`, `Content-Type`, `X-CSRF-Token`,
   `Idempotency-Key` and `X-Evidence-Grant`. Confirm the deployment's state IDs.
2. Obtain valid Operator, Technician, alternate Technician and IT Admin test
   accounts, approved Ticket mappings and disposable Ticket/Asset fixtures.
   The IT Admin requires no mapping. Log in and verify the role via Core.
3. Create a disposable manual Ticket, assign/reassign, view it as Technician,
   record the three progress transitions and an internal note, then close and
   reopen as the authorized actor. Upload and retrieve a PNG and a PDF using
   the approved private Evidence configuration. Archive the Ticket, confirm
   that ordinary routes conceal it, and restore it. Verify the same canonical ID, history, Evidence,
   ownership, Asset links and Audit attribution.
4. Verify IT Admin, unrelated and former Assignee, non-Owner closure and invalid
   transition denials. Use only an approved recovery fixture to inject an
   ambiguous write and test the saved-key replay. Keep Ticket 3 and quarantined
   Ticket 11 outside the write scope.
5. Record the environment, frontend build, case IDs and evidence in staging.
   The Incident/Maintenance provider scenarios and physical-client acceptance
   remain separate release gates.

## Archive and Evidence

Authorized Operators can move a Ticket to Trash, open the Archived Tickets view, and restore it with a reason. Archived Evidence is readable only within that management scope. Technician work can append Evidence while the Ticket is active and visible. Evidence accepts PNG, JPEG, WebP and PDF up to 8 MiB. A private store must be activated in Core before users can upload. PDF downloads as an attachment. Upload and viewing use short-lived grants through Core and never a direct storage URL. Keep the same tab open if a finalization is unresolved. Reuse the saved request key and grant rather than starting a second submission. Core can resume finalization for up to 24 hours after upload grant expiry. Public deployment needs owner approval for persistence, network and file handling.
