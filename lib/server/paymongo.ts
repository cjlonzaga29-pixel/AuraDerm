import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PayMongoConfig } from "@/lib/server/config";

// PayMongo Hosted Checkout, sandbox only (see docs/checkout-setup.md for the
// documentation this follows):
// - POST /v1/checkout_sessions and GET /v1/checkout_sessions/{id}, HTTP Basic
//   auth with the secret key as username and an empty password.
// - Webhooks carry `Paymongo-Signature: t=<ts>,te=<test sig>,li=<live sig>`;
//   the signature is HMAC-SHA256 of `${t}.${rawBody}` keyed with the webhook
//   secret, compared against `te` for test events.
// - The paid event is `checkout_session.payment.paid`; `data.attributes.livemode`
//   says whether an event is live.
// The config layer only ever hands this module an sk_test_ key; it refuses
// any other key here as well.

const API = "https://api.paymongo.com/v1";

export class PayMongoError extends Error {
  constructor(
    message: string,
    /** true when PayMongo may or may not have created the resource. */
    readonly uncertain: boolean,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "PayMongoError";
  }
}

export type CheckoutLineItem = { name: string; amount: number; currency: "PHP"; quantity: number };

export type CheckoutSession = {
  id: string;
  checkoutUrl: string | null;
  livemode: boolean;
  status: string | null;
  referenceNumber: string | null;
  /** The first payment with status "paid", if any. */
  paidPayment: { id: string; amountMinor: number; currency: string } | null;
};

export interface PayMongoClient {
  createCheckoutSession(input: {
    lineItems: CheckoutLineItem[];
    referenceNumber: string;
    description: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSession>;
  retrieveCheckoutSession(id: string): Promise<CheckoutSession>;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (typeof v === "object" && v !== null ? (v as Json) : {});

export function parseCheckoutSession(body: unknown): CheckoutSession {
  const data = obj(obj(body).data);
  const attrs = obj(data.attributes);
  const payments = Array.isArray(attrs.payments) ? attrs.payments : [];
  const paid = payments
    .map((p) => {
      const pa = obj(obj(p).attributes);
      return {
        id: String(obj(p).id ?? ""),
        status: pa.status,
        amountMinor: Number(pa.amount),
        currency: String(pa.currency ?? ""),
      };
    })
    .find((p) => p.status === "paid" && Number.isInteger(p.amountMinor));
  return {
    id: String(data.id ?? ""),
    checkoutUrl: typeof attrs.checkout_url === "string" ? attrs.checkout_url : null,
    livemode: attrs.livemode === true,
    status: typeof attrs.status === "string" ? attrs.status : null,
    referenceNumber: typeof attrs.reference_number === "string" ? attrs.reference_number : null,
    paidPayment: paid ? { id: paid.id, amountMinor: paid.amountMinor, currency: paid.currency } : null,
  };
}

export class HttpPayMongoClient implements PayMongoClient {
  private readonly auth: string;
  private readonly paymentMethodTypes: string[];

  constructor(
    config: PayMongoConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    if (!config.secretKey.startsWith("sk_test_")) {
      throw new Error("Refusing to use a non-test PayMongo key.");
    }
    this.auth = `Basic ${Buffer.from(`${config.secretKey}:`).toString("base64")}`;
    this.paymentMethodTypes = config.paymentMethodTypes;
  }

  private async request(path: string, init: RequestInit, mutating: boolean): Promise<CheckoutSession> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${API}${path}`, {
        ...init,
        headers: { Authorization: this.auth, "Content-Type": "application/json", Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      // A timeout or dropped connection on create may still have created a session.
      throw new PayMongoError(`PayMongo unreachable: ${(error as Error).name}`, mutating, null);
    }
    if (!response.ok) {
      throw new PayMongoError(`PayMongo HTTP ${response.status}`, mutating && response.status >= 500, response.status);
    }
    const session = parseCheckoutSession(await response.json());
    if (!session.id) throw new PayMongoError("PayMongo returned no session id", mutating, response.status);
    if (session.livemode) throw new PayMongoError("PayMongo returned a live session", false, response.status);
    return session;
  }

  createCheckoutSession(input: Parameters<PayMongoClient["createCheckoutSession"]>[0]) {
    return this.request(
      "/checkout_sessions",
      {
        method: "POST",
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: input.lineItems,
              payment_method_types: this.paymentMethodTypes,
              reference_number: input.referenceNumber,
              description: input.description,
              success_url: input.successUrl,
              cancel_url: input.cancelUrl,
              metadata: input.metadata,
              send_email_receipt: false,
              show_line_items: true,
            },
          },
        }),
      },
      true,
    );
  }

  retrieveCheckoutSession(id: string) {
    if (!/^cs_[A-Za-z0-9]+$/.test(id)) {
      return Promise.reject(new PayMongoError("Invalid checkout session id", false, null));
    }
    return this.request(`/checkout_sessions/${id}`, { method: "GET" }, false);
  }
}

export type SignatureCheck =
  | { ok: true }
  | { ok: false; reason: "missing_header" | "malformed_header" | "live_event" | "mismatch" };

export function parseSignatureHeader(header: string): { t: string; te: string; li: string } | null {
  const parts = new Map<string, string>();
  for (const piece of header.split(",")) {
    const eq = piece.indexOf("=");
    if (eq <= 0) continue;
    parts.set(piece.slice(0, eq).trim(), piece.slice(eq + 1).trim());
  }
  const t = parts.get("t");
  if (!t || !/^\d+$/.test(t)) return null;
  return { t, te: parts.get("te") ?? "", li: parts.get("li") ?? "" };
}

export function signPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

// Test-mode verification only: an event signed for live mode (li set, te
// empty) is refused outright, never accepted.
export function verifyWebhookSignature(header: string | null, rawBody: string, secret: string): SignatureCheck {
  if (!header) return { ok: false, reason: "missing_header" };
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { ok: false, reason: "malformed_header" };
  if (!parsed.te) return { ok: false, reason: parsed.li ? "live_event" : "malformed_header" };
  const expected = Buffer.from(signPayload(secret, parsed.t, rawBody), "hex");
  const received = /^[0-9a-f]+$/i.test(parsed.te) ? Buffer.from(parsed.te, "hex") : Buffer.alloc(0);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true };
}

export type WebhookEvent = {
  id: string;
  type: string;
  livemode: boolean;
  /** Checkout session id for checkout_session.* events. */
  sessionId: string | null;
};

export function parseWebhookEvent(body: unknown): WebhookEvent | null {
  const data = obj(obj(body).data);
  const attrs = obj(data.attributes);
  const resource = obj(attrs.data);
  const id = typeof data.id === "string" ? data.id : "";
  const type = typeof attrs.type === "string" ? attrs.type : "";
  if (!id || !type) return null;
  const resourceId = typeof resource.id === "string" ? resource.id : null;
  return {
    id,
    type,
    livemode: attrs.livemode === true,
    sessionId: type.startsWith("checkout_session.") ? resourceId : null,
  };
}
