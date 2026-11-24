# AR-IMMS Mobile Technician

The React Native Technician app lives in this repository under `mobile/`. It uses Expo SDK 58, Expo Router, React Native 0.88, React 19.3 and pnpm. The WF-04 work connects the existing Login, Overview, Tickets, Ticket Detail, History and Profile screens to the AR-IMMS Core deployment.

## Run on a physical iPhone

1. Connect the iPhone and Windows machine to the same approved development LAN. In Safari on the iPhone, open the approved Core endpoint followed by `/health/ready` and verify it responds. Use the Windows LAN address or an approved HTTPS endpoint.
2. From the frontend repository, run the following in PowerShell. Use Node.js 22.22.3 for the commands below. Replace the example address with the approved Core endpoint.

   ```powershell
   Set-Location -LiteralPath 'C:\Users\Admin\AR-IMMS frontend\ar-imms-frontend\mobile'
   pnpm.cmd install --frozen-lockfile
   $env:EXPO_PUBLIC_CORE_API_URL='http://192.168.1.20:8082'
   $env:EXPO_PUBLIC_TICKET_STATE_IDS='{"NEW":1,"OPEN":2,"PENDING":3,"CLOSED":4}'
   pnpm.cmd start:lan
   ```

3. Sign in to Expo Go 58 and the Expo CLI with the same Expo account. Run `pnpm.cmd exec expo login` if the CLI is signed out. Open the terminal QR code with the iPhone Camera and allow Local Network access when prompted. [Expo Go setup for physical iOS devices](https://docs.expo.dev/get-started/set-up-your-environment/?device=physical&mode=expo-go&platform=ios)
4. Sign in to AR-IMMS with an active, mapped Core Technician account. From Web, have an Operator assign an approved disposable Ticket to that Technician. Verify NEW → OPEN, add an internal note, try image/PDF upload and preview/share, then verify OPEN → PENDING → OPEN. Confirm the same changes and Ticket number on Web. Keep Ticket 3, Ticket 11, and historical fixtures outside the test.

Expo Go 58 includes the APIs used for camera/gallery, document picking, native upload, file sharing, date/time selection and regular SecureStore access. This app uses SecureStore without biometric authentication. Confirm native permissions, storage, sharing and the live workflow on the iPhone. [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/)

## Run on a physical Android phone

1. Start the approved Core PoC and verify `http://localhost:8082/health/ready` on Windows. Obtain an authorized, mapped Core Technician account and a disposable Ticket that the Web Operator may create and assign. Check that the installed Expo client supports SDK 58.
2. Connect the phone and Windows machine to an approved development network. Use the Windows LAN address for Core, for example `http://192.168.1.20:8082`. An approved HTTPS development endpoint may be used instead. The phone's own localhost does not address Windows. For Android over USB, an authorized `adb reverse tcp:8082 tcp:8082` also allows `http://127.0.0.1:8082` on the phone while Expo is served separately.
3. From this mobile package, set process-local variables and start Expo. Replace the example LAN IP.

   ```powershell
   pnpm.cmd install --frozen-lockfile
   $env:EXPO_PUBLIC_CORE_API_URL='http://192.168.1.20:8082'
   $env:EXPO_PUBLIC_TICKET_STATE_IDS='{"NEW":1,"OPEN":2,"PENDING":3,"CLOSED":4}'
   pnpm.cmd start:lan
   ```

4. Scan the Expo QR with the supported Expo client. Sign in using the Technician's Core credentials. Complete the required first-login password change if prompted, then sign in again.
5. From Web, use an approved disposable Ticket and assign it to the Technician. Pull to refresh the mobile queue, record its canonical number and ID, start work, add a note and Evidence, set Pending with a future local deadline, and resume. Confirm the same Ticket and changes on Web, then close it on Web as current Business Owner. Keep protected Tickets and historical fixtures outside write scope.

For the Android Emulator use `http://10.0.2.2:8082`; on an iOS Simulator hosted on a machine running Core use `http://127.0.0.1:8082`. For physical iPhone use the approved LAN or HTTPS endpoint. Public variables hold only addresses and the confirmed environment state IDs. The values shown above are for the verified PoC. Core does not expose a public state catalog. Missing, ambiguous or unknown state IDs disable progress actions. Priority labels/colors always come from Core. Keep native production traffic on HTTPS and keep Zammad/MongoDB private.

## Contract and app behavior

| Screen | Core calls |
| --- | --- |
| Login and Profile | `POST /api/v1/auth/login`, `/refresh`, `/logout`, `/change-password` as needed, and `GET /api/v1/auth/me`. Only active Technicians with Ticket read can enter the workspace. Refresh tokens rotate in a serialized session path and are stored in SecureStore. Access tokens stay in memory. Expo Web preview has in-memory credentials only. |
| Overview, Tickets, History | `GET /api/v1/tickets` with `assignee_user_id` from verified IAM, with cursor, state, priority and title search as applicable. `GET /api/v1/tickets/metadata/priorities` supplies readable priorities. Totals in these screens reflect loaded items. |
| Detail and updates | `GET /api/v1/tickets/{id}`, `/links` and `/articles`; authorized Asset metadata via `GET /api/v1/asset-topology/assets/{id}`. Technician progress uses `POST /tickets/{id}/status` for NEW ? OPEN ? PENDING ? OPEN. Notes use `POST /tickets/{id}/articles`. A pending receipt stores the original actor, Ticket, key and payload in protected storage. Reopen the same Ticket and retry the saved request after an uncertain outcome. |
| Evidence | Request an upload grant, send raw binary with `X-Evidence-Grant`, and finalize with an operation key. The preview/download uses a short-lived Core access grant and authenticated content request. Gallery, camera and PDF picker are native, with temporary files in app-controlled cache. Supported file types are PNG, JPEG, WebP and PDF up to 8 MiB. Temporary files are removed after preview/share when possible. |

The four bottom tabs open Overview, Tickets, History and Profile. Asset scanning is still accessible from Overview. Start work, Set pending and Resume work open a confirmation sheet with the Ticket number, title and both states. Set pending requires a future local deadline. Cancel dismisses the sheet. When Core reports an uncertain outcome, open the same Ticket and use **Retry same request**. On Expo Web, keep the current browser session open because receipts are held in memory.

The Ticket notification sheet loads from Core for the signed-in user. Opening the sheet or returning to the foreground refreshes the inbox, and the active app also refreshes it every minute. Read acknowledgements are stored in Core and are shared with the Web Dashboard. Tap an item to open its Ticket. Queue and detail refresh on focus and app foreground. Technician create/close/reopen/assignment remain on the appropriate Web workflow. Legacy Incident routes have no authorized Core equivalent in this iteration. The existing WebAR scanner opens its configured browser target and requires independent auth there; Core bearer tokens are kept within the mobile Core request path.

## Verification

The mobile workspace copies packages during install. Metro on Windows misidentified some store-linked package files during the SDK 58 migration. If this checkout still has a dependency directory from an earlier setup, move `mobile/node_modules` aside before running the frozen install.

```powershell
pnpm.cmd exec expo install --check
pnpm.cmd dlx expo-doctor
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd test:ui
pnpm.cmd exec expo lint
$iosBundle = Join-Path $env:TEMP ('arimms-expo-ios-' + [guid]::NewGuid().ToString('N'))
pnpm.cmd exec expo export --clear --platform ios --max-workers 3 --output-dir $iosBundle
```

The UI suite exports Expo Web into a temporary directory and uses Edge on Windows with an intercepted Core fixture. On other hosts install the Playwright Chromium browser with `pnpm exec playwright-core install chromium`, or set `WF04_BROWSER_CHANNEL` to an installed supported browser. Set `WF04_UI_SCREENSHOTS` to an output directory to capture the reviewed screens.

The Node tests use an isolated fake Core HTTP server. Expo bundling validates the native dependency graph. Run Expo on an attached emulator or physical device to validate SecureStore, camera/PDF selection, binary upload progress, preview/share and Web-to-Mobile assignment with approved live fixtures. A web preview does not exercise those native capabilities.
