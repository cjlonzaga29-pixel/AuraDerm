import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOrder,
  getOrderStatus,
  handlePayMongoWebhook,
  processSheetOutbox,
  quoteOrder,
  type CheckoutDeps,
} from "@/lib/server/checkout";
import { resolveCheckoutConfig } from "@/lib/server/config";
import { PayMongoError, signPayload, type CheckoutSession, type PayMongoClient } from "@/lib/server/paymongo";
import { SheetsError, type CodSheetPayload, type SheetsClient } from "@/lib/server/sheets";
import { MemoryOrderRepository } from "../support/memory-repo";

// Mocked adapter tests: an in-memory repository, a fake PayMongo and a fake
// Sheets client. They exercise the checkout logic only — no database,
// PayMongo sandbox or Google Sheet is contacted.

const WEBHOOK_SECRET = "whsk_test_secret";
const ENV = {
  CHECKOUT_MODE: "test",
  SUPABASE_URL: "https://brrydhnpwkfejehksdkn.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
  PAYMONGO_SECRET_KEY: "sk_test_fake",
  PAYMONGO_WEBHOOK_SECRET: WEBHOOK_SECRET,
  COD_SHEET_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbTestDeploymentId0123456789/exec",
  COD_SHEET_SIGNING_SECRET: "test-signing-secret-0123456789abcdef",
};

class FakePayMongo implements PayMongoClient {
  sessions = new Map<string, CheckoutSession & { amount: number }>();
  failCreate: "none" | "definite" | "uncertain" = "none";
  creates = 0;

  async createCheckoutSession(input: Parameters<PayMongoClient["createCheckoutSession"]>[0]) {
    this.creates += 1;
    if (this.failCreate === "definite") throw new PayMongoError("PayMongo HTTP 400", false, 400);
    if (this.failCreate === "uncertain") throw new PayMongoError("PayMongo unreachable: TimeoutError", true, null);
    const id = `cs_${this.creates}`;
    const session = {
      id,
      checkoutUrl: `https://checkout.paymongo.test/${id}`,
      livemode: false,
      status: "active",
      referenceNumber: input.referenceNumber,
      paidPayment: null,
      amount: input.lineItems.reduce((sum, l) => sum + l.amount * l.quantity, 0),
    };
    this.sessions.set(id, session);
    return session;
  }

  async retrieveCheckoutSession(id: string) {
    const session = this.sessions.get(id);
    if (!session) throw new PayMongoError("PayMongo HTTP 404", false, 404);
    return session;
  }

  pay(id: string, amount?: number) {
    const session = this.sessions.get(id)!;
    session.paidPayment = { id: "pay_1", amountMinor: amount ?? session.amount, currency: "PHP" };
  }
}

// Stands in for the Apps Script receiver: one row per order ID.
class FakeSheets implements SheetsClient {
  rows: CodSheetPayload[] = [];
  failDeliveries = 0;
  async deliver(payload: CodSheetPayload) {
    if (this.failDeliveries > 0) {
      this.failDeliveries -= 1;
      throw new SheetsError("Apps Script timed out");
    }
    const existing = this.rows.findIndex((r) => r.orderId === payload.orderId);
    if (existing >= 0) return { orderId: payload.orderId, result: "duplicate" as const, row: existing + 2 };
    this.rows.push(payload);
    return { orderId: payload.orderId, result: "created" as const, row: this.rows.length + 1 };
  }
}

const CUSTOMER = {
  fullName: "Maria Santos",
  phone: "09171234567",
  email: "maria@example.com",
  address: { line1: "=HYPERLINK(\"http://evil\")", barangay: "San Isidro", city: "Quezon City", province: "Metro Manila", postalCode: "1100", notes: "" },
};

let repo: MemoryOrderRepository;
let paymongo: FakePayMongo;
let sheets: FakeSheets;
let deps: CheckoutDeps;
const logs: string[] = [];

beforeEach(() => {
  repo = new MemoryOrderRepository();
  paymongo = new FakePayMongo();
  sheets = new FakeSheets();
  logs.length = 0;
  deps = { config: resolveCheckoutConfig(ENV), repo, paymongo, sheets, log: (m) => logs.push(m) };
});

const order = (overrides: Record<string, unknown> = {}) => ({
  idempotencyKey: "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0",
  acknowledgeTestMode: true,
  paymentMethod: "cod",
  lines: [{ handle: "hair-fall-defense-shampoo", quantity: 2 }],
  expectedSubtotalMinor: 259800,
  customer: CUSTOMER,
  ...overrides,
});
const ctx = { clientIp: "203.0.113.5", origin: "https://auraderm.test" };

const webhook = (event: Record<string, unknown>) => {
  const raw = JSON.stringify({ data: { id: event.id, attributes: { type: event.type, livemode: event.livemode ?? false, data: { id: event.sessionId } } } });
  const t = "1700000000";
  return { raw, header: `t=${t},te=${signPayload(WEBHOOK_SECRET, t, raw)},li=` };
};

describe("quote", () => {
  it("returns server-calculated sample totals with no invented delivery charge", () => {
    const result = quoteOrder({ lines: [{ handle: "hair-fall-defense-shampoo", quantity: 2 }, { handle: "scalp-balance-daily-shampoo", quantity: 1 }] }, deps);
    expect(result.body).toMatchObject({ ok: true, subtotalMinor: 389700, shippingMinor: null, totalMinor: 389700, usesSamplePrices: true });
  });
});

describe("order creation", () => {
  it("refuses everything when checkout is not configured", async () => {
    const off = { ...deps, config: resolveCheckoutConfig({}), repo: null };
    const result = await createOrder(order(), ctx, off);
    expect(result.status).toBe(503);
    expect(result.body.ok).toBe(false);
  });

  it("requires the test-mode acknowledgment", async () => {
    const result = await createOrder(order({ acknowledgeTestMode: false }), ctx, deps);
    expect(result.body.error).toBe("test_mode_not_acknowledged");
    expect(repo.orders).toHaveLength(0);
  });

  it("rejects tampered prices, totals that differ from the server, bad quantities and unknown products", async () => {
    const tampered = await createOrder(order({ lines: [{ handle: "hair-fall-defense-shampoo", quantity: 2, priceMinor: 100 }] }), ctx, deps);
    expect(tampered.body.error).toBe("client_price_rejected");
    const cheap = await createOrder(order({ expectedSubtotalMinor: 200 }), ctx, deps);
    expect(cheap.status).toBe(409);
    expect(cheap.body).toMatchObject({ error: "price_changed", subtotalMinor: 259800 });
    expect((await createOrder(order({ lines: [{ handle: "hair-fall-defense-shampoo", quantity: 0 }] }), ctx, deps)).body.error).toBe("invalid_quantity");
    expect((await createOrder(order({ lines: [{ handle: "fake", quantity: 1 }] }), ctx, deps)).body.error).toBe("unknown_product");
    expect(repo.orders).toHaveLength(0);
  });

  it("records a COD test order as unpaid, awaiting confirmation, with item snapshots and an outbox job", async () => {
    const result = await createOrder(order(), ctx, deps);
    expect(result.status).toBe(201);
    expect(result.syncSheets).toBe(true);
    const stored = repo.byReference(String(result.body.reference))!;
    expect(stored.reference).toMatch(/^AD-T-[A-Z0-9]{8}$/);
    expect(stored).toMatchObject({ mode: "test", paymentStatus: "cod_pending", fulfillmentStatus: "awaiting_confirmation", subtotalMinor: 259800, shippingMinor: null, totalMinor: 259800 });
    expect(stored.input.lines).toEqual([
      expect.objectContaining({ handle: "hair-fall-defense-shampoo", unitPriceMinor: 129900, quantity: 2, lineTotalMinor: 259800, priceKind: "sample" }),
    ]);
    expect(stored.input.usesSamplePrices).toBe(true);
    expect(stored.input.clientFingerprint).not.toContain("203.0.113.5");
    expect(repo.jobs).toHaveLength(1);
    expect(logs.join("\n")).not.toMatch(/Maria|0917|maria@|Mabini|HYPERLINK/);
  });

  it("turns a duplicate submission into the same order, and a reused key with new details into a conflict", async () => {
    const first = await createOrder(order(), ctx, deps);
    const again = await createOrder(order(), ctx, deps);
    expect(again.status).toBe(200);
    expect(again.body.reference).toBe(first.body.reference);
    expect(again.body.token).toBe(first.body.token);
    expect(repo.orders).toHaveLength(1);
    expect(repo.jobs).toHaveLength(1);

    const changed = await createOrder(order({ lines: [{ handle: "hair-fall-defense-shampoo", quantity: 3 }], expectedSubtotalMinor: 389700 }), ctx, deps);
    expect(changed.body.error).toBe("idempotency_conflict");
    expect(repo.orders).toHaveLength(1);
  });

  it("applies a per-client submission limit", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await createOrder(order({ idempotencyKey: `key-${i}-aaaaaaaaaaaaaaaa` }), ctx, deps);
      expect(r.status).toBe(201);
    }
    const blocked = await createOrder(order({ idempotencyKey: "key-6-aaaaaaaaaaaaaaaa" }), ctx, deps);
    expect(blocked.status).toBe(429);
  });

  it("never reports success when the order write fails", async () => {
    repo.failNextCreate = true;
    const result = await createOrder(order(), ctx, deps);
    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ ok: false, error: "order_not_recorded" });
  });

  it("online: persists the order before creating the session, then attaches the session", async () => {
    const result = await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({ next: "redirect", checkoutUrl: "https://checkout.paymongo.test/cs_1" });
    const stored = repo.byReference(String(result.body.reference))!;
    expect(stored).toMatchObject({ paymentStatus: "awaiting_payment", providerSessionId: "cs_1" });
    expect(paymongo.sessions.get("cs_1")!.amount).toBe(259800);
    expect(paymongo.sessions.get("cs_1")!.referenceNumber).toBe(stored.reference);
    expect(repo.jobs).toHaveLength(0);
  });

  it("online: a retried submission reuses the existing session instead of creating another", async () => {
    await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    const again = await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    expect(again.body.checkoutUrl).toBe("https://checkout.paymongo.test/cs_1");
    expect(paymongo.creates).toBe(1);
  });

  it("online: a failed or uncertain session start keeps the order and can be retried", async () => {
    paymongo.failCreate = "definite";
    const failed = await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    expect(failed.status).toBe(502);
    expect(failed.body.reference).toBeTruthy();
    expect(repo.byReference(String(failed.body.reference))!.paymentStatus).toBe("session_failed");

    paymongo.failCreate = "uncertain";
    const uncertain = await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    expect(uncertain.status).toBe(502);
    expect(uncertain.body.message).toMatch(/could not confirm/);

    paymongo.failCreate = "none";
    const retried = await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    expect(retried.body.next).toBe("redirect");
    expect(repo.orders).toHaveLength(1);
    expect(repo.orders[0]).toMatchObject({ paymentStatus: "awaiting_payment", providerSessionId: "cs_3" });
  });

  it("online is refused when PayMongo is not configured; COD still works", async () => {
    const noPay = { ...deps, config: resolveCheckoutConfig({ ...ENV, PAYMONGO_SECRET_KEY: "" }), paymongo: null };
    expect((await createOrder(order({ paymentMethod: "online" }), ctx, noPay)).status).toBe(503);
    expect((await createOrder(order(), ctx, noPay)).status).toBe(201);
  });
});

describe("payment confirmation", () => {
  async function placeOnline() {
    const result = await createOrder(order({ paymentMethod: "online" }), ctx, deps);
    return { reference: String(result.body.reference), token: String(result.body.token) };
  }

  it("a success redirect alone never marks the order paid", async () => {
    const { reference, token } = await placeOnline();
    const status = await getOrderStatus({ reference, token }, deps);
    expect(status.body.paymentStatus).toBe("awaiting_payment");
    expect(repo.byReference(reference)!.paymentStatus).toBe("awaiting_payment");
  });

  it("a verified webhook marks it paid once; repeated deliveries are no-ops", async () => {
    const { reference } = await placeOnline();
    paymongo.pay("cs_1");
    const { raw, header } = webhook({ id: "evt_1", type: "checkout_session.payment.paid", sessionId: "cs_1" });
    expect((await handlePayMongoWebhook(raw, header, deps)).body).toMatchObject({ outcome: "applied" });
    expect(repo.byReference(reference)!.paymentStatus).toBe("paid");
    expect((await handlePayMongoWebhook(raw, header, deps)).body).toMatchObject({ duplicate: true });
    const second = webhook({ id: "evt_2", type: "checkout_session.payment.paid", sessionId: "cs_1" });
    expect((await handlePayMongoWebhook(second.raw, second.header, deps)).body).toMatchObject({ outcome: "applied" });
    expect(repo.events.get("evt_2")!.detail).toBe("already_paid");
  });

  it("rejects unsigned, live, unpaid and wrong-amount events without marking paid", async () => {
    const { reference } = await placeOnline();
    const { raw } = webhook({ id: "evt_x", type: "checkout_session.payment.paid", sessionId: "cs_1" });
    expect((await handlePayMongoWebhook(raw, "t=1,te=deadbeef,li=", deps)).status).toBe(400);

    const live = webhook({ id: "evt_live", type: "checkout_session.payment.paid", sessionId: "cs_1", livemode: true });
    expect((await handlePayMongoWebhook(live.raw, live.header, deps)).body).toMatchObject({ outcome: "rejected" });

    const unpaid = webhook({ id: "evt_unpaid", type: "checkout_session.payment.paid", sessionId: "cs_1" });
    expect((await handlePayMongoWebhook(unpaid.raw, unpaid.header, deps)).body).toMatchObject({ outcome: "rejected" });

    paymongo.pay("cs_1", 100);
    const short = webhook({ id: "evt_short", type: "checkout_session.payment.paid", sessionId: "cs_1" });
    expect((await handlePayMongoWebhook(short.raw, short.header, deps)).body).toMatchObject({ outcome: "rejected" });
    expect(repo.events.get("evt_short")!.detail).toBe("amount_mismatch");
    expect(repo.byReference(reference)!.paymentStatus).toBe("awaiting_payment");
  });

  it("ignores unrelated event types", async () => {
    const other = webhook({ id: "evt_other", type: "payment.failed", sessionId: "pay_1" });
    expect((await handlePayMongoWebhook(other.raw, other.header, deps)).body).toMatchObject({ outcome: "ignored" });
  });

  it("a transient failure leaves the event retryable", async () => {
    await placeOnline();
    paymongo.pay("cs_1");
    const original = paymongo.retrieveCheckoutSession.bind(paymongo);
    paymongo.retrieveCheckoutSession = vi.fn().mockRejectedValueOnce(new PayMongoError("PayMongo HTTP 503", false, 503));
    const { raw, header } = webhook({ id: "evt_r", type: "checkout_session.payment.paid", sessionId: "cs_1" });
    expect((await handlePayMongoWebhook(raw, header, deps)).status).toBe(500);
    paymongo.retrieveCheckoutSession = original;
    expect((await handlePayMongoWebhook(raw, header, deps)).body).toMatchObject({ outcome: "applied" });
  });

  it("status reconciliation marks paid only from a server-side PayMongo lookup", async () => {
    const { reference, token } = await placeOnline();
    paymongo.pay("cs_1");
    const status = await getOrderStatus({ reference, token }, deps);
    expect(status.body.paymentStatus).toBe("paid");
    expect(repo.byReference(reference)!.paymentStatus).toBe("paid");
  });

  it("status requires the matching token and never lists orders", async () => {
    const { reference } = await placeOnline();
    expect((await getOrderStatus({ reference, token: "wrong" }, deps)).status).toBe(404);
    expect((await getOrderStatus({ reference: null, token: null }, deps)).status).toBe(404);
  });
});

describe("COD → Google Sheets outbox", () => {
  it("keeps the order when the sheet fails, retries, and delivers exactly one row", async () => {
    const placed = await createOrder(order(), ctx, deps);
    const reference = String(placed.body.reference);
    sheets.failDeliveries = 2;

    const first = await processSheetOutbox(deps);
    expect(first).toMatchObject({ claimed: 1, synced: 0, failed: 1 });
    expect(repo.byReference(reference)!.sheetSyncStatus).toBe("failed");
    expect(repo.byReference(reference)!.paymentStatus).toBe("cod_pending");
    expect(repo.jobs[0].error).toBe("Apps Script timed out");
    const pending = await getOrderStatus({ reference, token: String(placed.body.token) }, deps);
    expect(pending.body).toMatchObject({ paymentStatus: "cod_pending", storeNotified: false });

    expect(await processSheetOutbox(deps)).toMatchObject({ failed: 1 });
    expect(await processSheetOutbox(deps)).toMatchObject({ synced: 1, failed: 0 });
    expect(await processSheetOutbox(deps)).toMatchObject({ claimed: 0 });
    expect(sheets.rows).toHaveLength(1);
    expect(repo.jobs[0].range).toBe("created: row 2");
    expect(repo.byReference(reference)!.sheetSyncStatus).toBe("synced");
    const notified = await getOrderStatus({ reference, token: String(placed.body.token) }, deps);
    expect(notified.body).toMatchObject({ paymentStatus: "cod_pending", storeNotified: true });
  });

  it("sends server totals and fields only, with unknown delivery left unknown", async () => {
    await createOrder(order({ lines: [{ handle: "hair-fall-defense-shampoo", quantity: 2 }, { handle: "scalp-balance-daily-shampoo", quantity: 1 }], expectedSubtotalMinor: 389700 }), ctx, deps);
    await processSheetOutbox(deps);
    const [row] = sheets.rows;
    expect(row).toMatchObject({
      mode: "test",
      orderStatus: "awaiting_confirmation",
      paymentMethod: "cod",
      paymentStatus: "cod_pending",
      customer: { name: "Maria Santos", mobile: "09171234567", email: "maria@example.com" },
      totalQuantity: 3,
      currency: "PHP",
      subtotal: "3897.00",
      deliveryFee: null,
      total: "3897.00",
    });
    expect(row.items).toEqual([
      { name: expect.any(String), quantity: 2, unitPrice: "1299.00", lineTotal: "2598.00" },
      { name: expect.any(String), quantity: 1, unitPrice: "1299.00", lineTotal: "1299.00" },
    ]);
    expect(row.address.street).toBe('=HYPERLINK("http://evil")');
    expect(Object.keys(row)).not.toContain("clientFingerprint");
    expect(JSON.stringify(row)).not.toMatch(/fingerprint|access_token|idempotency|request_hash/i);
  });

  it("an acknowledged duplicate completes the job without a second row", async () => {
    const placed = await createOrder(order(), ctx, deps);
    sheets.rows.push({ orderId: String(placed.body.reference) } as CodSheetPayload);
    expect(await processSheetOutbox(deps)).toMatchObject({ synced: 1 });
    expect(sheets.rows).toHaveLength(1);
    expect(repo.jobs[0].range).toBe("duplicate: row 2");
  });

  it("leaves jobs queued when the sheet is not configured", async () => {
    const noSheet = { ...deps, config: resolveCheckoutConfig({ ...ENV, COD_SHEET_APPS_SCRIPT_URL: "" }), sheets: null };
    await createOrder(order(), ctx, noSheet);
    expect(await processSheetOutbox(noSheet)).toMatchObject({ skipped: "sheet_not_configured" });
    expect(repo.jobs[0].status).toBe("pending");
  });
});
