import { describe, expect, it, vi } from "vitest";
import {
  HttpPayMongoClient,
  parseCheckoutSession,
  parseSignatureHeader,
  parseWebhookEvent,
  signPayload,
  verifyWebhookSignature,
} from "@/lib/server/paymongo";
import { resolveCheckoutConfig } from "@/lib/server/config";

// Mocked adapter tests: no request reaches PayMongo.
const SECRET = "whsk_test_secret";
const body = JSON.stringify({ data: { id: "evt_1", attributes: { type: "checkout_session.payment.paid", livemode: false, data: { id: "cs_abc" } } } });

describe("PayMongo webhook signature", () => {
  it("accepts a correct test-mode signature over `${t}.${rawBody}`", () => {
    const header = `t=1700000000,te=${signPayload(SECRET, "1700000000", body)},li=`;
    expect(verifyWebhookSignature(header, body, SECRET)).toEqual({ ok: true });
  });

  it("rejects a tampered body, wrong secret, wrong timestamp and garbage", () => {
    const sig = signPayload(SECRET, "1700000000", body);
    expect(verifyWebhookSignature(`t=1700000000,te=${sig},li=`, body.replace("cs_abc", "cs_xyz"), SECRET)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyWebhookSignature(`t=1700000000,te=${sig},li=`, body, "other")).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyWebhookSignature(`t=1700000001,te=${sig},li=`, body, SECRET)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyWebhookSignature("t=1700000000,te=zz,li=", body, SECRET)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyWebhookSignature(null, body, SECRET)).toEqual({ ok: false, reason: "missing_header" });
    expect(verifyWebhookSignature("nonsense", body, SECRET)).toEqual({ ok: false, reason: "malformed_header" });
  });

  it("refuses live-mode signatures (li set, te empty)", () => {
    const header = `t=1700000000,te=,li=${signPayload(SECRET, "1700000000", body)}`;
    expect(verifyWebhookSignature(header, body, SECRET)).toEqual({ ok: false, reason: "live_event" });
  });

  it("parses the header and the event envelope", () => {
    expect(parseSignatureHeader("t=1,te=ab,li=")).toEqual({ t: "1", te: "ab", li: "" });
    expect(parseWebhookEvent(JSON.parse(body))).toEqual({
      id: "evt_1",
      type: "checkout_session.payment.paid",
      livemode: false,
      sessionId: "cs_abc",
    });
    expect(parseWebhookEvent({})).toBeNull();
  });
});

describe("PayMongo checkout client (mocked fetch)", () => {
  const config = { secretKey: "sk_test_abc", webhookSecret: SECRET, paymentMethodTypes: ["qrph"] };

  it("refuses any non-test key", () => {
    expect(() => new HttpPayMongoClient({ ...config, secretKey: "sk_live_abc" })).toThrow(/non-test/);
  });

  it("creates a session with Basic auth, integer centavo amounts and the order reference", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ data: { id: "cs_1", attributes: { checkout_url: "https://checkout.paymongo.com/x", livemode: false, status: "active" } } }),
    );
    const client = new HttpPayMongoClient(config, fetchImpl as unknown as typeof fetch);
    const session = await client.createCheckoutSession({
      lineItems: [{ name: "Shampoo", amount: 129900, currency: "PHP", quantity: 2 }],
      referenceNumber: "AD-T-ABCDEFGH",
      description: "test",
      successUrl: "https://example.test/ok",
      cancelUrl: "https://example.test/cancel",
      metadata: { order_reference: "AD-T-ABCDEFGH", mode: "test" },
    });
    expect(session.id).toBe("cs_1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.paymongo.com/v1/checkout_sessions");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("sk_test_abc:").toString("base64")}`);
    const sent = JSON.parse(String(init.body)).data.attributes;
    expect(sent.line_items[0]).toEqual({ name: "Shampoo", amount: 129900, currency: "PHP", quantity: 2 });
    expect(sent.reference_number).toBe("AD-T-ABCDEFGH");
    expect(sent.payment_method_types).toEqual(["qrph"]);
  });

  it("treats a network failure on create as uncertain and a live session as an error", async () => {
    const down = new HttpPayMongoClient(config, (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch);
    await expect(down.retrieveCheckoutSession("cs_1")).rejects.toMatchObject({ uncertain: false });
    await expect(
      down.createCheckoutSession({ lineItems: [], referenceNumber: "r", description: "", successUrl: "", cancelUrl: "", metadata: {} }),
    ).rejects.toMatchObject({ uncertain: true });

    const live = new HttpPayMongoClient(config, (async () =>
      Response.json({ data: { id: "cs_1", attributes: { livemode: true } } })) as unknown as typeof fetch);
    await expect(live.retrieveCheckoutSession("cs_1")).rejects.toThrow(/live session/);
  });

  it("reads the first paid payment from a session", () => {
    const session = parseCheckoutSession({
      data: {
        id: "cs_1",
        attributes: {
          reference_number: "AD-T-ABCDEFGH",
          payments: [
            { id: "pay_0", attributes: { status: "failed", amount: 259800, currency: "PHP" } },
            { id: "pay_1", attributes: { status: "paid", amount: 259800, currency: "PHP" } },
          ],
        },
      },
    });
    expect(session.paidPayment).toEqual({ id: "pay_1", amountMinor: 259800, currency: "PHP" });
    expect(session.referenceNumber).toBe("AD-T-ABCDEFGH");
  });
});

describe("checkout configuration", () => {
  const supa = { SUPABASE_URL: "https://brrydhnpwkfejehksdkn.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service" };

  it("is disabled unless CHECKOUT_MODE=test and the AuraDerm database is configured", () => {
    expect(resolveCheckoutConfig({}).mode).toBe("disabled");
    expect(resolveCheckoutConfig({ CHECKOUT_MODE: "test" }).mode).toBe("disabled");
    expect(resolveCheckoutConfig({ ...supa }).mode).toBe("disabled");
    expect(resolveCheckoutConfig({ ...supa, CHECKOUT_MODE: "test" }).mode).toBe("test");
  });

  it("never enables live mode", () => {
    const config = resolveCheckoutConfig({ ...supa, CHECKOUT_MODE: "live" });
    expect(config.mode).toBe("disabled");
    expect(config.issues[0]).toMatch(/Live checkout is not enabled/);
  });

  it("refuses any Supabase project other than AuraDerm's", () => {
    const config = resolveCheckoutConfig({ ...supa, CHECKOUT_MODE: "test", SUPABASE_URL: "https://otherproject.supabase.co" });
    expect(config.mode).toBe("disabled");
    expect(config.supabase).toBeNull();
  });

  it("accepts only sk_test_ PayMongo keys with a webhook secret, never falling back", () => {
    expect(resolveCheckoutConfig({ PAYMONGO_SECRET_KEY: "sk_live_x", PAYMONGO_WEBHOOK_SECRET: "w" }).paymongo).toBeNull();
    expect(resolveCheckoutConfig({ PAYMONGO_SECRET_KEY: "sk_test_x" }).paymongo).toBeNull();
    expect(resolveCheckoutConfig({ PAYMONGO_SECRET_KEY: "sk_test_x", PAYMONGO_WEBHOOK_SECRET: "w" }).paymongo?.secretKey).toBe("sk_test_x");
  });

  it("has no delivery pricing rule configured", () => {
    expect(resolveCheckoutConfig({ ...supa, CHECKOUT_MODE: "test" }).shippingMinor).toBeNull();
  });
});
