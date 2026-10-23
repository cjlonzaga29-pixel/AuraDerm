# COD orders → Google Sheet (Apps Script)

Cash-on-delivery (COD) orders reach the owner's private Google Sheet this way:

```
Browser → AuraDerm server → Supabase order + outbox job (one transaction)
        → signed POST → owner's Apps Script web app (/exec) → private sheet
```

The browser never sees the Apps Script URL or the signing secret, and never
writes to the sheet. An order is saved in the database before anything is sent
to Google, so a sheet outage cannot lose an order. The job stays queued and is
retried.

Source: `apps-script/cod-orders/Code.gs` and `apps-script/cod-orders/appsscript.json`.
Server side: `lib/server/sheets.ts` and `processSheetOutbox` in `lib/server/checkout.ts`.

Only **test** orders are accepted, at both ends. Live COD needs code changes
here and on the server, plus the items under "Required before live checkout"
in `docs/checkout-setup.md`.

## 1. The sheet

1. Use the owner's own sheet, and keep its sharing set to **Restricted**.
   Nobody needs to be added: the script runs as the owner.
2. The script creates a tab named **`Test orders`** on first use, or you can
   run `setupOrdersTab` once (step 2.6). To use a different tab name, set the
   `ORDERS_TAB` script property.

## 2. The script (bound to the sheet)

1. Open the sheet, then go to **Extensions → Apps Script**. The script must be
   bound to this sheet: `@OnlyCurrentDoc` limits it to this one spreadsheet.
2. Replace the contents of `Code.gs` with `apps-script/cod-orders/Code.gs`.
3. Go to **Project Settings**, tick **Show "appsscript.json" manifest file in
   editor**, and replace the manifest with `apps-script/cod-orders/appsscript.json`.
4. Generate a signing secret on your own computer, for example
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   Don't paste it into chats, issues or commits.
5. Go to **Project Settings → Script properties** and add
   `COD_SIGNING_SECRET` = that secret (at least 32 characters). Optionally
   add `ORDERS_TAB`.
6. In the editor, select `setupOrdersTab` and click **Run**. Google asks for
   authorization the first time. Review it and allow it **with the owner's
   account**. The tab and its header row appear.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**, then choose type **Web app**.
2. Set **Execute as: Me** (the owner). The script writes with the owner's
   permission, so the sheet stays private.
3. Set **Who has access: Anyone**. The AuraDerm server calls it without a
   Google sign-in. Every request is still rejected unless its HMAC signature
   is valid and its timestamp is fresh. With any other access setting, Google
   answers with a sign-in page, which the server treats as a failure.
4. Copy the **Web app URL**. It ends in **`/exec`**. Do not use the `/dev`
   URL: it only works for the script's editors while they are signed in, and
   the server refuses it.
5. After any later code change, use **Deploy → Manage deployments → Edit →
   Version: New version**. This keeps the same `/exec` URL. A new deployment
   would get a new URL.

## 4. Server configuration (Vercel, server variables only)

| Name | Value |
| --- | --- |
| `COD_SHEET_APPS_SCRIPT_URL` | The `/exec` web app URL from step 3.4. |
| `COD_SHEET_SIGNING_SECRET` | The same secret as `COD_SIGNING_SECRET` in step 2.5. |
| `CRON_SECRET` | A separate random secret. It authorizes the retry endpoint. |

Add them with `vercel env add <NAME> production` (and `preview` if wanted),
or in the Vercel dashboard. Never use a `NEXT_PUBLIC_` prefix. Environment
changes take effect only in a **new deployment**, so merge or redeploy after
setting them.

This is the only COD transport. The earlier service-account variables
(`GOOGLE_SHEETS_*`, `GOOGLE_SERVICE_ACCOUNT_*`) are no longer read, so an
order can never be written twice by two different routes.

## Protocol

The request body is JSON:

```json
{ "v": 1, "ts": "1792700000", "sig": "<64 hex>", "payload": "<JSON text>" }
```

- `sig` = hex(HMAC-SHA256(secret, `ts + "." + payload`)), computed over the
  exact UTF-8 text sent as `payload`. Apps Script's `doPost(e)` cannot read
  request headers, so the signature and timestamp travel in the body.
- The receiver checks the signature with a constant-time comparison, then
  checks that `ts` is at most 300 s old and at most 60 s in the future. Only
  then does it parse and validate the payload: sizes, field lengths,
  `AD-T-…` order ID, test mode, PH mobile format, quantities 1–10, and
  integer-cent arithmetic for line totals, subtotal and total.
- Inside a script lock, it looks the order ID up in column A. If the ID is
  already there, it replies `duplicate` and writes nothing. Edits and the
  staff columns are never touched. Otherwise it appends one row.
- Reply: `{"ok":true,"orderId":"AD-T-…","result":"created"|"duplicate","row":N}`,
  or `{"ok":false,"error":"<code>"}`. Error codes are `unauthorized`,
  `stale_request`, `invalid_request`, `mode_not_allowed`, `busy`,
  `not_configured` and `server_error`. Errors never include order details.

Apps Script always answers HTTP 200, via a redirect to
`script.googleusercontent.com`. The server therefore:

- posts with `redirect: "manual"`, and follows only a redirect to that host,
  by GET, once;
- applies one 20-second deadline to the whole exchange;
- accepts only a JSON object with `ok: true`, a `created`/`duplicate` result
  and **the same order ID**.

An HTML page (such as a Google sign-in page), malformed JSON, a different
order ID, a timeout or any other status counts as a failure. The job then
stays queued with backoff (30 s, doubling, up to 1 hour, at most 20 attempts).
Because the receiver deduplicates by order ID, retrying after an uncertain
failure is always safe.

## Sheet columns

| # | Column | Notes |
| --- | --- | --- |
| A | Order ID | `AD-T-XXXXXXXX`. The duplicate key. |
| B | Created At | ISO 8601, UTC. |
| C | Mode | `TEST`. |
| D | Order Status | e.g. `awaiting_confirmation`. |
| E | Payment Method | `Cash on delivery`. |
| F | Payment Status | e.g. `cod_pending` (unpaid). |
| G | Customer Name | |
| H | Mobile | Local form `09XXXXXXXXX`, leading zero kept. |
| I | Email | |
| J | Street Address | |
| K | Barangay | |
| L | City | |
| M | Province | |
| N | Postal Code | May be empty. |
| O | Items | `2 × Product @ 1299.00; …` |
| P | Total Quantity | |
| Q | Currency | `PHP`. |
| R | Subtotal | Server-computed from integer centavos. |
| S | Delivery Fee | `Unknown (not configured)` until a delivery rule exists. It is never shown as "Free". |
| T | Total | With unknown delivery: `2598.00 + delivery (unknown)`. |
| U | Delivery Notes | |
| V | Staff Status | For staff only. The script never writes here. |
| W | Staff Notes | For staff only. The script never writes here. |

Each written row is formatted as plain text (`@`) before its values are set,
so phone numbers keep their leading zero and nothing is turned into a number,
date or formula. A value that starts with `=`, `+`, `-` or `@` also gets a
leading apostrophe, so it stays literal even if the format is changed later.
No card data, payment tokens, client fingerprints, access tokens or other
internal fields are sent.

## Retries

- After each COD order, the server tries to deliver queued jobs in the
  background.
- `vercel.json` registers a **daily** Vercel Cron call to
  `/api/internal/sheet-sync` at 01:00 UTC (09:00 Manila). On the Hobby plan,
  Vercel runs cron jobs at most once a day. Vercel sends
  `Authorization: Bearer $CRON_SECRET` automatically. Until `CRON_SECRET` is
  set, the endpoint answers 401 and nothing is retried.
- To retry by hand, send `POST /api/internal/sheet-sync` with
  `Authorization: Bearer <CRON_SECRET>` from a trusted machine. Never put
  `CRON_SECRET` in a URL, a public workflow or a chat.

## Verifying a deployment

With the variables set and a deployment that includes them:

1. With `CHECKOUT_MODE=test`, place **one** COD order using clearly
   fictitious details (name `TEST …`, an `example.invalid` email, a dummy
   address). It appears as one row marked `TEST`, and the status page says
   the store has received it.
2. Replay that delivery. In the Supabase SQL editor for project
   `brrydhnpwkfejehksdkn`, run
   `update public.sheet_sync_outbox set status = 'pending', next_attempt_at = now() where order_id = (select id from public.orders where reference = 'AD-T-…');`.
   Then call the retry endpoint. The job's `synced_range` becomes
   `duplicate: row N`, and the sheet still has exactly one row for that ID.
3. Delete the fictitious row afterwards if you like. Test orders are never
   counted as sales.
