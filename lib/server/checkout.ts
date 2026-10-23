import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { getShopProducts, type ShopProduct } from "@/lib/catalog";
import { describePricingError, priceLines } from "@/lib/checkout/pricing";
import { isPaymentMethod, validateCustomer, type FieldErrors } from "@/lib/checkout/customer";
import { ORDER_RATE_LIMIT, ORDER_RATE_WINDOW_SECONDS } from "@/lib/checkout/limits";
import type { CheckoutConfig } from "@/lib/server/config";
import { RepositoryError, type OrderRepository, type StoredOrder } from "@/lib/server/repository";
import {
  PayMongoError,
  parseWebhookEvent,
  verifyWebhookSignature,
  type PayMongoClient,
} from "@/lib/server/paymongo";
import { buildCodPayload, type SheetsClient } from "@/lib/server/sheets";

// Checkout orchestration. Every price is recomputed from the server catalog;
// an order is written durably before any payment session exists; only a
// verified webhook or a server-side PayMongo lookup can mark it paid (never a
// browser redirect); and COD orders reach the sheet through a durable outbox.
// Logs carry order references and error kinds only — no customer details.

export type CheckoutDeps = {
  config: CheckoutConfig;
  repo: OrderRepository | null;
  paymongo: PayMongoClient | null;
  sheets: SheetsClient | null;
  products?: ShopProduct[];
  log?: (message: string) => void;
};

export type ApiResult = { status: number; body: Record<string, unknown> };

const fail = (status: number, error: string, message: string, extra: Record<string, unknown> = {}): ApiResult => ({
  status,
  body: { ok: false, error, message, ...extra },
});

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const IDEMPOTENCY_KEY = /^[A-Za-z0-9-]{16,64}$/;
const REFERENCE = /^AD-[TL]-[A-Z0-9]{8}$/;
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newReference(mode: "test" | "live"): string {
  const bytes = randomBytes(8);
  const body = Array.from(bytes, (b) => REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length]).join("");
  return `AD-${mode === "test" ? "T" : "L"}-${body}`;
}

// The order-status token is derived from the idempotency key with a server
// secret, so a retried submission gets the same token back; only its hash is
// stored.
function accessTokenFor(config: CheckoutConfig, idempotencyKey: string): string {
  return createHmac("sha256", config.supabase!.serviceRoleKey).update(`order-access:${idempotencyKey}`).digest("base64url");
}

function fingerprint(config: CheckoutConfig, clientIp: string | null): string | null {
  if (!clientIp) return null;
  return createHmac("sha256", config.supabase!.serviceRoleKey).update(`client:${clientIp}`).digest("hex");
}

export function quoteOrder(body: unknown, deps: Pick<CheckoutDeps, "config" | "products">): ApiResult {
  const lines = typeof body === "object" && body !== null ? (body as Record<string, unknown>).lines : undefined;
  const priced = priceLines(lines, deps.products ?? getShopProducts());
  if (!priced.ok) return fail(400, priced.error.code, describePricingError(priced.error));
  const { order } = priced;
  return {
    status: 200,
    body: {
      ok: true,
      lines: order.lines,
      currency: order.currency,
      subtotalMinor: order.subtotalMinor,
      shippingMinor: deps.config.shippingMinor,
      totalMinor: order.subtotalMinor + (deps.config.shippingMinor ?? 0),
      usesSamplePrices: order.usesSamplePrices,
    },
  };
}

function resultUrls(base: string, reference: string, token: string) {
  const query = new URLSearchParams({ ref: reference, token });
  return {
    successUrl: `${base}/checkout/result?${query}`,
    cancelUrl: `${base}/checkout/result?${query}&cancelled=1`,
  };
}

async function startPayment(
  deps: CheckoutDeps,
  order: StoredOrder,
  lines: { name: string; unitPriceMinor: number; quantity: number }[],
  token: string,
  origin: string,
): Promise<ApiResult> {
  const { repo, paymongo, log } = deps;
  const handle = { reference: order.reference, token, paymentMethod: "online" as const };

  // A retried submission whose session already exists reuses it.
  if (order.providerSessionId) {
    try {
      const session = await paymongo!.retrieveCheckoutSession(order.providerSessionId);
      if (session.paidPayment) return { status: 200, body: { ok: true, ...handle, next: "status" } };
      if (session.checkoutUrl && session.status !== "expired") {
        return { status: 200, body: { ok: true, ...handle, next: "redirect", checkoutUrl: session.checkoutUrl } };
      }
    } catch (error) {
      log?.(`checkout: session lookup failed for ${order.reference}: ${(error as Error).message}`);
      return fail(502, "payment_unavailable", "We could not reach the payment provider. Your order is saved; please try again.", handle);
    }
  }

  const base = deps.config.siteUrl ?? origin;
  try {
    const session = await paymongo!.createCheckoutSession({
      lineItems: lines.map((l) => ({ name: l.name, amount: l.unitPriceMinor, currency: "PHP", quantity: l.quantity })),
      referenceNumber: order.reference,
      description: `AuraDerm ${order.mode === "test" ? "TEST " : ""}order ${order.reference}`,
      ...resultUrls(base, order.reference, token),
      metadata: { order_reference: order.reference, mode: order.mode },
    });
    const attached = await repo!.attachSession(order.id, session.id);
    if (!attached || !session.checkoutUrl) {
      log?.(`checkout: session ${session.id} not attachable to ${order.reference}`);
      return fail(502, "payment_unavailable", "Payment could not be started. Your order is saved; please try again.", handle);
    }
    return { status: 201, body: { ok: true, ...handle, next: "redirect", checkoutUrl: session.checkoutUrl } };
  } catch (error) {
    const uncertain = error instanceof PayMongoError && error.uncertain;
    log?.(`checkout: session create failed for ${order.reference} (${uncertain ? "uncertain" : "failed"}): ${(error as Error).message}`);
    if (!uncertain && !(error instanceof RepositoryError)) {
      await repo!.markSessionFailed(order.id).catch(() => undefined);
    }
    return fail(
      502,
      "payment_unavailable",
      uncertain
        ? "We could not confirm that payment was started. Your order is saved and nothing has been charged; please try again."
        : "Payment could not be started. Your order is saved and nothing has been charged; please try again.",
      handle,
    );
  }
}

export async function createOrder(
  body: unknown,
  context: { clientIp: string | null; origin: string },
  deps: CheckoutDeps,
): Promise<ApiResult & { syncSheets?: boolean }> {
  const { config, repo, log } = deps;
  if (config.mode !== "test" || !repo || !config.supabase) {
    return fail(503, "checkout_unavailable", "Checkout is not enabled on this site yet, so no order was placed.");
  }

  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (input.acknowledgeTestMode !== true) {
    return fail(400, "test_mode_not_acknowledged", "Please confirm that you understand this is a test order.");
  }
  const idempotencyKey = typeof input.idempotencyKey === "string" ? input.idempotencyKey : "";
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    return fail(400, "invalid_request", "This checkout attempt could not be identified. Please reload the page.");
  }
  if (!isPaymentMethod(input.paymentMethod)) {
    return fail(400, "invalid_payment_method", "Choose a payment method.");
  }
  const paymentMethod = input.paymentMethod;
  if (paymentMethod === "online" && !deps.paymongo) {
    return fail(503, "online_unavailable", "Online payment is not available in test mode right now.");
  }

  const priced = priceLines(input.lines, deps.products ?? getShopProducts());
  if (!priced.ok) return fail(400, priced.error.code, describePricingError(priced.error));
  const { order: pricedOrder } = priced;

  // The browser shows the server's quote; if prices moved since, stop and
  // let the customer review rather than charge a different amount.
  if (input.expectedSubtotalMinor !== pricedOrder.subtotalMinor) {
    return fail(409, "price_changed", "Prices have changed since this page loaded. Please review your order.", {
      subtotalMinor: pricedOrder.subtotalMinor,
    });
  }

  const customer = validateCustomer(input.customer);
  if (!customer.ok) {
    return fail(400, "invalid_customer", "Please check the highlighted fields.", { fieldErrors: customer.errors satisfies FieldErrors });
  }

  // Test orders may be recorded without a delivery price; live orders could
  // not be (and live mode is not enabled at all).
  const shippingMinor = config.shippingMinor;
  const totalMinor = pricedOrder.subtotalMinor + (shippingMinor ?? 0);
  const token = accessTokenFor(config, idempotencyKey);
  const requestHash = sha256(
    JSON.stringify({
      lines: pricedOrder.lines.map((l) => [l.handle, l.quantity]).sort(),
      customer: customer.customer,
      paymentMethod,
    }),
  );

  let created;
  try {
    created = await repo.createOrder(
      {
        reference: newReference("test"),
        idempotencyKey,
        requestHash,
        accessTokenHash: sha256(token),
        mode: "test",
        currency: "PHP",
        subtotalMinor: pricedOrder.subtotalMinor,
        shippingMinor,
        totalMinor,
        usesSamplePrices: pricedOrder.usesSamplePrices,
        customer: customer.customer,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "cod_pending" : "awaiting_payment",
        fulfillmentStatus: paymentMethod === "cod" ? "awaiting_confirmation" : "unfulfilled",
        clientFingerprint: fingerprint(config, context.clientIp),
        lines: pricedOrder.lines,
      },
      { rateLimit: ORDER_RATE_LIMIT, windowSeconds: ORDER_RATE_WINDOW_SECONDS },
    );
  } catch (error) {
    log?.(`checkout: order write failed: ${(error as Error).message}`);
    return fail(503, "order_not_recorded", "Your order could not be recorded, so nothing was placed. Please try again.");
  }

  if (created.kind === "rate_limited") {
    return fail(429, "rate_limited", "Too many orders from this connection. Please wait a few minutes and try again.");
  }
  if (created.kind === "idempotency_conflict") {
    return fail(409, "idempotency_conflict", "This checkout attempt was already used for a different order. Please reload the page.");
  }

  const order = created.order;
  if (created.kind === "created") log?.(`checkout: recorded ${order.reference} (${paymentMethod}, test)`);

  if (order.paymentMethod === "cod") {
    return {
      status: created.kind === "created" ? 201 : 200,
      body: { ok: true, reference: order.reference, token, paymentMethod: "cod", next: "status" },
      syncSheets: true,
    };
  }

  return startPayment(deps, order, pricedOrder.lines, token, context.origin);
}

export async function getOrderStatus(
  query: { reference: string | null; token: string | null },
  deps: CheckoutDeps,
): Promise<ApiResult> {
  const { repo, paymongo, log } = deps;
  if (!repo) return fail(503, "checkout_unavailable", "Order status is not available.");
  if (!query.reference || !REFERENCE.test(query.reference) || !query.token || query.token.length > 100) {
    return fail(404, "not_found", "We could not find that order.");
  }
  let order: StoredOrder | null;
  try {
    order = await repo.orderStatus(query.reference, sha256(query.token));
  } catch (error) {
    log?.(`checkout: status lookup failed: ${(error as Error).message}`);
    return fail(503, "status_unavailable", "Order status is temporarily unavailable. Please try again.");
  }
  if (!order) return fail(404, "not_found", "We could not find that order.");

  // Reconciliation: if the webhook has not arrived yet, ask PayMongo directly.
  // Only a server-side lookup showing a paid payment can mark the order paid.
  if (order.paymentMethod === "online" && order.paymentStatus === "awaiting_payment" && order.providerSessionId && paymongo) {
    try {
      const session = await paymongo.retrieveCheckoutSession(order.providerSessionId);
      if (session.paidPayment && !session.livemode) {
        const marked = await repo.markPaid({
          sessionId: session.id,
          reference: session.referenceNumber ?? "",
          mode: "test",
          amountMinor: session.paidPayment.amountMinor,
          currency: session.paidPayment.currency.toUpperCase(),
          paymentId: session.paidPayment.id || null,
        });
        if (marked.result === "marked_paid" || marked.result === "already_paid") {
          order = { ...order, paymentStatus: "paid" };
        } else {
          log?.(`checkout: reconcile refused for ${order.reference}: ${marked.result}`);
        }
      }
    } catch (error) {
      log?.(`checkout: reconcile lookup failed for ${order.reference}: ${(error as Error).message}`);
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      reference: order.reference,
      mode: order.mode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      totalMinor: order.totalMinor,
      subtotalMinor: order.subtotalMinor,
      shippingMinor: order.shippingMinor,
      currency: order.currency,
      // COD only: whether the store's order sheet has acknowledged the order.
      // The order is recorded either way; this never reflects payment.
      storeNotified: order.paymentMethod === "cod" ? order.sheetSyncStatus === "synced" : null,
    },
  };
}

export async function handlePayMongoWebhook(
  rawBody: string,
  signatureHeader: string | null,
  deps: CheckoutDeps,
): Promise<ApiResult> {
  const { config, repo, paymongo, log } = deps;
  const secret = config.paymongo?.webhookSecret;
  if (!secret || !repo || !paymongo) return fail(503, "not_configured", "Webhook not configured.");

  const check = verifyWebhookSignature(signatureHeader, rawBody, secret);
  if (!check.ok) {
    log?.(`webhook: rejected signature (${check.reason})`);
    return fail(400, "invalid_signature", "Signature verification failed.");
  }

  let event;
  try {
    event = parseWebhookEvent(JSON.parse(rawBody));
  } catch {
    event = null;
  }
  if (!event) return fail(400, "invalid_event", "Unreadable event.");

  try {
    const { duplicate } = await repo.recordEvent(event);
    if (duplicate) return { status: 200, body: { ok: true, duplicate: true } };

    if (event.livemode) {
      await repo.finishEvent(event.id, null, "rejected", "live event received by test integration");
      return { status: 200, body: { ok: true, outcome: "rejected" } };
    }
    if (event.type !== "checkout_session.payment.paid" || !event.sessionId) {
      await repo.finishEvent(event.id, null, "ignored", `unhandled event type ${event.type}`);
      return { status: 200, body: { ok: true, outcome: "ignored" } };
    }

    // The payload is a hint; the session is re-read from PayMongo before any
    // state changes.
    const session = await paymongo.retrieveCheckoutSession(event.sessionId);
    if (session.livemode || !session.paidPayment) {
      await repo.finishEvent(event.id, null, "rejected", session.livemode ? "session is live" : "session has no paid payment");
      return { status: 200, body: { ok: true, outcome: "rejected" } };
    }
    const marked = await repo.markPaid({
      sessionId: session.id,
      reference: session.referenceNumber ?? "",
      mode: "test",
      amountMinor: session.paidPayment.amountMinor,
      currency: session.paidPayment.currency.toUpperCase(),
      paymentId: session.paidPayment.id || null,
    });
    const applied = marked.result === "marked_paid" || marked.result === "already_paid";
    await repo.finishEvent(event.id, marked.orderId, applied ? "applied" : "rejected", marked.result);
    if (!applied) log?.(`webhook: ${event.id} not applied (${marked.result})`);
    return { status: 200, body: { ok: true, outcome: applied ? "applied" : "rejected" } };
  } catch (error) {
    // Left as 'received' so PayMongo's retry is processed again.
    log?.(`webhook: processing failed for ${event.id}: ${(error as Error).message}`);
    return fail(500, "processing_failed", "Temporary failure; please retry.");
  }
}

export type SheetSyncSummary = { claimed: number; synced: number; failed: number; skipped?: string };

// Delivers queued COD orders to the Apps Script receiver. A job is completed
// only on a matching acknowledgement ("created" or "duplicate": the receiver
// never writes a second row for an order ID); anything else leaves it failed
// and queued with backoff. The order itself is never touched by a failure.
export async function processSheetOutbox(deps: CheckoutDeps, limit = 10): Promise<SheetSyncSummary> {
  const { config, repo, sheets, log } = deps;
  if (!repo) return { claimed: 0, synced: 0, failed: 0, skipped: "database_not_configured" };
  if (!sheets || !config.sheets) return { claimed: 0, synced: 0, failed: 0, skipped: "sheet_not_configured" };

  const jobs = await repo.claimSheetJobs(limit);
  const summary: SheetSyncSummary = { claimed: jobs.length, synced: 0, failed: 0 };

  for (const job of jobs) {
    try {
      const ack = await sheets.deliver(buildCodPayload(job));
      await repo.completeSheetJob(job.jobId, ack.row === null ? ack.result : `${ack.result}: row ${ack.row}`);
      summary.synced += 1;
    } catch (error) {
      summary.failed += 1;
      const message = (error as Error).message;
      log?.(`sheets: sync failed for ${job.order.reference}: ${message}`);
      await repo.failSheetJob(job.jobId, message).catch(() => undefined);
    }
  }
  return summary;
}
