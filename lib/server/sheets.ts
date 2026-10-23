import "server-only";
import { createHmac } from "node:crypto";
import type { SheetsConfig } from "@/lib/server/config";
import type { SheetJob } from "@/lib/server/repository";

// Cash-on-delivery order log: the server posts one signed envelope per order
// to the owner's Google Apps Script web app (apps-script/cod-orders/Code.gs),
// which appends one row per order ID to their private sheet. The browser never
// sees the endpoint or the secret. Apps Script cannot read request headers, so
// the timestamp and HMAC-SHA256 signature travel in the JSON body alongside
// the exact payload text they sign.
//
// Apps Script answers every request with HTTP 200 (errors included), after a
// redirect to script.googleusercontent.com. A delivery only counts when that
// response is a JSON acknowledgement with ok: true and the same order ID.

/** What the receiver writes: server-computed values only, money as decimals. */
export type CodSheetPayload = {
  orderId: string;
  createdAt: string;
  mode: "test";
  orderStatus: string;
  paymentMethod: "cod";
  paymentStatus: string;
  customer: { name: string; mobile: string; email: string };
  address: { street: string; barangay: string; city: string; province: string; postalCode: string; notes: string };
  items: { name: string; quantity: number; unitPrice: string; lineTotal: string }[];
  totalQuantity: number;
  currency: "PHP";
  subtotal: string;
  /** null when no delivery pricing is configured: shown as unknown, never free. */
  deliveryFee: string | null;
  total: string;
};

export type CodSheetAck = { orderId: string; result: "created" | "duplicate"; row: number | null };

export interface SheetsClient {
  deliver(payload: CodSheetPayload): Promise<CodSheetAck>;
}

/** Messages are error kinds only: never payload or customer details. */
export class SheetsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsError";
  }
}

/** Integer minor units to a decimal string, without floating point. */
export function decimal(minor: number): string {
  return `${Math.trunc(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

/** +639XXXXXXXXX (as stored) to the local 09XXXXXXXXX form staff dial. */
export function localMobile(phone: string): string {
  return phone.replace(/^\+63/, "0");
}

export function buildCodPayload(job: SheetJob): CodSheetPayload {
  const { order } = job;
  if (order.mode !== "test") throw new SheetsError("live orders are not supported");
  const address = order.deliveryAddress;
  return {
    orderId: order.reference,
    createdAt: order.createdAt,
    mode: "test",
    orderStatus: order.fulfillmentStatus,
    paymentMethod: "cod",
    paymentStatus: order.paymentStatus,
    customer: { name: order.customerName, mobile: localMobile(order.customerPhone), email: order.customerEmail },
    address: {
      street: address.line1,
      barangay: address.barangay,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode ?? "",
      notes: address.notes ?? "",
    },
    items: job.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: decimal(i.unitPriceMinor),
      lineTotal: decimal(i.lineTotalMinor),
    })),
    totalQuantity: job.items.reduce((sum, i) => sum + i.quantity, 0),
    currency: order.currency,
    subtotal: decimal(order.subtotalMinor),
    deliveryFee: order.shippingMinor === null ? null : decimal(order.shippingMinor),
    total: decimal(order.totalMinor),
  };
}

export const ENVELOPE_VERSION = 1;

export function signEnvelope(secret: string, payloadText: string, timestamp: number) {
  const ts = String(timestamp);
  const sig = createHmac("sha256", secret).update(`${ts}.${payloadText}`, "utf8").digest("hex");
  return { v: ENVELOPE_VERSION, ts, sig, payload: payloadText };
}

const ECHO_HOST = "script.googleusercontent.com";
const MAX_RESPONSE_CHARS = 8192;
const RECEIVER_ERROR = /^[a-z_]{1,40}$/;

export class AppsScriptSheetsClient implements SheetsClient {
  constructor(
    private readonly config: SheetsConfig,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
    private readonly timeoutMs = 20_000,
  ) {}

  async deliver(payload: CodSheetPayload): Promise<CodSheetAck> {
    const payloadText = JSON.stringify(payload);
    const envelope = signEnvelope(this.config.signingSecret, payloadText, Math.floor(this.now() / 1000));
    // One deadline covers the POST and the redirect that follows it.
    const signal = AbortSignal.timeout(this.timeoutMs);

    let response = await this.request(this.config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal,
    });
    if (response.status >= 300 && response.status < 400) {
      // The script has run by now; its reply waits at a one-time echo URL.
      // Follow it only to Google's echo host, by GET, and no further.
      const location = response.headers.get("location");
      let target: URL;
      try {
        target = new URL(location ?? "", this.config.endpoint);
      } catch {
        throw new SheetsError("Apps Script redirect without a valid location");
      }
      if (target.protocol !== "https:" || target.host !== ECHO_HOST) {
        throw new SheetsError("Apps Script redirected away from Google's response host (is access set to Anyone?)");
      }
      response = await this.request(target.toString(), { method: "GET", signal });
    }
    return this.readAck(response, payload.orderId);
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetchImpl(url, { ...init, redirect: "manual", cache: "no-store" });
    } catch (error) {
      const name = (error as Error).name;
      throw new SheetsError(
        name === "TimeoutError" || name === "AbortError" ? "Apps Script timed out" : `Apps Script unreachable: ${name}`,
      );
    }
  }

  private async readAck(response: Response, orderId: string): Promise<CodSheetAck> {
    if (response.status !== 200) throw new SheetsError(`Apps Script HTTP ${response.status}`);
    let text: string;
    try {
      text = await response.text();
    } catch (error) {
      throw new SheetsError(`Apps Script response unreadable: ${(error as Error).name}`);
    }
    if (text.length > MAX_RESPONSE_CHARS) throw new SheetsError("Apps Script response too large");
    const type = response.headers.get("content-type") ?? "";
    if (/html/i.test(type) || /^\s*</.test(text)) {
      throw new SheetsError("Apps Script returned HTML (sign-in page or error), not an acknowledgement");
    }
    let ack: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      ack = parsed as Record<string, unknown>;
    } catch {
      throw new SheetsError("Apps Script response is not a JSON object");
    }
    if (ack.ok !== true) {
      const code = typeof ack.error === "string" && RECEIVER_ERROR.test(ack.error) ? ack.error : "unknown";
      throw new SheetsError(`Apps Script refused the order: ${code}`);
    }
    if (ack.orderId !== orderId) throw new SheetsError("Apps Script acknowledged a different order ID");
    if (ack.result !== "created" && ack.result !== "duplicate") {
      throw new SheetsError("Apps Script acknowledgement has no result");
    }
    const row = typeof ack.row === "number" && Number.isInteger(ack.row) && ack.row > 1 ? ack.row : null;
    return { orderId, result: ack.result, row };
  }
}
