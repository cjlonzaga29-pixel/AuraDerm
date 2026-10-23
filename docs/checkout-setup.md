# Test checkout: setup and operation

The storefront has a test-only checkout: server-priced orders stored in
Supabase, PayMongo **sandbox** Hosted Checkout for online payment, and cash on
delivery (COD) orders copied to the owner's private Google Sheet through a
signed Apps Script web app (see `docs/cod-apps-script.md`). It is **off** until it
is configured. Live payment and live COD are not implemented: sample prices
are still active, and delivery pricing and store policies are not confirmed.

`site.commerce` stays `false`. The test checkout does not depend on it.

## How it behaves

- The browser sends only product handles and quantities. The server reprices
  every line from `lib/catalog.ts`, rejects any client-supplied price field,
  unknown product, duplicate line or quantity outside 1–10, and refuses the
  order if the subtotal differs from the quote the customer saw.
- An order and its immutable item snapshots are written in one transaction
  **before** any payment session exists. Each checkout attempt carries an
  idempotency key, so a retried submission returns the same order.
- Online: the order's reference is sent as the PayMongo `reference_number`,
  and the session id is stored on the order. An order becomes `paid` only
  when the server confirms it, either through a signature-verified
  `checkout_session.payment.paid` webhook or through a server-side
  `GET /v1/checkout_sessions/{id}` on the status page. Before marking the
  order paid, the server re-reads the session from PayMongo and checks the
  reference, test mode, amount and currency. Repeated webhook events are
  deduplicated by event id. The success redirect alone never marks an order
  paid.
- COD: the order is recorded as `cod_pending` / `awaiting_confirmation`
  (unpaid). The same transaction queues a sheet sync job. The server delivers
  it as a signed request to the owner's Apps Script, and completes the job
  only on a JSON acknowledgement for the same order ID. If the sheet is
  unreachable or not configured, the order stays in the database, the job is
  retried with backoff, and the status page says the store's order list has
  not been updated yet.
- The bag empties only after a COD order is durably recorded, or after an
  online order from the bag is confirmed paid. Buy now never changes the bag.
- No delivery pricing rule exists. Test orders are recorded with
  `shipping_minor = null` ("not configured"), and the database refuses live
  orders without a delivery price or with sample prices.
- Customer details never appear in logs. Logs carry order references and
  error kinds only.

## Environment variables (names only)

Set these in Vercel, Production and/or Preview, as **server** variables. Never
use a `NEXT_PUBLIC_` prefix, and never commit values. `.env.example` lists the
same names.

| Name | Purpose |
| --- | --- |
| `CHECKOUT_MODE` | `test` enables the test checkout. Unset or any other value disables it. `live` is refused. |
| `SITE_URL` | Public origin used for PayMongo success/cancel URLs, e.g. `https://<your-domain>`. Defaults to the request origin. |
| `SUPABASE_URL` | Must be `https://brrydhnpwkfejehksdkn.supabase.co`. Any other project is refused. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role (or `sb_secret_…`) key. Server only. |
| `PAYMONGO_SECRET_KEY` | **Test** secret key `sk_test_…`. Any other key disables online payment, and there is no fallback. |
| `PAYMONGO_WEBHOOK_SECRET` | Secret returned when the test webhook is created. |
| `PAYMONGO_PAYMENT_METHOD_TYPES` | Optional comma list. Default: `qrph,card,gcash,paymaya`. Use only methods enabled on the account. |
| `COD_SHEET_APPS_SCRIPT_URL` | The owner's Apps Script web app URL, ending in `/exec`. `/dev` is refused. |
| `COD_SHEET_SIGNING_SECRET` | Shared HMAC secret, at least 32 characters. It must match the script's `COD_SIGNING_SECRET` property. |
| `CRON_SECRET` | Bearer secret for `/api/internal/sheet-sync`, the retry endpoint. Vercel Cron sends it automatically. |

## 1. Supabase migration (project `brrydhnpwkfejehksdkn` only)

Migration: `supabase/migrations/20261021120000_checkout_foundation.sql`. It is
additive: four tables, a view and RPC functions in `public`, with RLS enabled,
no policies, and anon/authenticated privileges revoked.

```sh
supabase link --project-ref brrydhnpwkfejehksdkn
supabase db push --dry-run   # review: only 20261021120000_checkout_foundation
supabase db push
```

Before pushing, confirm the linked ref is `brrydhnpwkfejehksdkn`. Never link or
push to any other project.

## 2. PayMongo sandbox

1. In the PayMongo dashboard, in **test mode**, copy the `sk_test_…` secret key
   into `PAYMONGO_SECRET_KEY`.
2. Create a webhook pointing to `https://<SITE_URL>/api/paymongo/webhook` for
   the event `checkout_session.payment.paid`, either in the dashboard (test
   mode) or with `POST /v1/webhooks` using the test key. Store the returned
   secret in `PAYMONGO_WEBHOOK_SECRET`.
3. Place a test order and complete it with PayMongo's test payment details.
   The status page shows "Test payment confirmed" only after the webhook or
   the server-side session lookup confirms payment.

Signature checks follow PayMongo's documented scheme. The
`Paymongo-Signature` header has the form `t=…,te=…,li=…`, and the signature
is HMAC-SHA256 of `"{t}.{raw body}"` with the webhook secret, compared to
`te`. Events signed for live mode are refused.

## 3. Google Sheet (COD orders)

Follow `docs/cod-apps-script.md`: bind the script in
`apps-script/cod-orders/` to the owner's private sheet, set its
`COD_SIGNING_SECRET` script property, deploy it as a web app (execute as the
owner, access "Anyone"), and set `COD_SHEET_APPS_SCRIPT_URL`,
`COD_SHEET_SIGNING_SECRET` and `CRON_SECRET` in Vercel. The sheet itself stays
private.

Retries: each new COD order triggers a background delivery attempt for every
queued job. `vercel.json` also registers a daily Vercel Cron call to the retry
endpoint, which is once a day on the Hobby plan. You can also call
`/api/internal/sheet-sync` by hand with `Authorization: Bearer <CRON_SECRET>`.

## Test-mode operation

- References look like `AD-T-XXXXXXXX`. `T` marks test orders, and test rows
  show `TEST` in the sheet. The Apps Script receiver accepts test orders only.
- Test orders are never counted as sales (see below).
- To switch checkout off, unset `CHECKOUT_MODE` or set it to anything other
  than `test`.

## Sold counts (future)

No sold or review counts are shown, because none exist. When they are added,
they must use `public.product_sold_units` (mirrored in `lib/checkout/sold.ts`).
That view counts units on **live** orders only, either paid online or COD
collected/delivered, and excludes cancelled, refunded and returned orders.
Test orders never count.

## Required before live checkout

- Confirmed retail prices for every product, replacing the sample price
  (₱1,299), and confirmed net contents.
- A delivery pricing rule, and confirmed delivery, returns and refund
  policies.
- PayMongo account activation and live keys, plus a code change to support
  live mode. This build refuses live keys.
- A live tab or sheet decision for COD, code changes so the Apps Script and
  the server accept live orders, and an owner process for confirming COD
  orders.
- A security review of the live configuration.
