import "server-only";
import type { SupabaseConfig } from "@/lib/server/config";
import type { CustomerDetails, PaymentMethod } from "@/lib/checkout/customer";
import type { PricedLine } from "@/lib/checkout/pricing";

// Storage boundary for orders. The Supabase implementation calls the RPC
// functions in supabase/migrations with the service-role key; tests use an
// in-memory implementation of the same interface.

export type OrderMode = "test" | "live";

export type NewOrder = {
  reference: string;
  idempotencyKey: string;
  requestHash: string;
  accessTokenHash: string;
  mode: OrderMode;
  currency: "PHP";
  subtotalMinor: number;
  shippingMinor: number | null;
  totalMinor: number;
  usesSamplePrices: boolean;
  customer: CustomerDetails;
  paymentMethod: PaymentMethod;
  paymentStatus: "awaiting_payment" | "cod_pending";
  fulfillmentStatus: "unfulfilled" | "awaiting_confirmation";
  clientFingerprint: string | null;
  lines: PricedLine[];
};

export type StoredOrder = {
  id: string;
  reference: string;
  mode: OrderMode;
  currency: "PHP";
  subtotalMinor: number;
  shippingMinor: number | null;
  totalMinor: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  fulfillmentStatus: string;
  sheetSyncStatus: string;
  providerSessionId: string | null;
  createdAt: string;
};

export type CreateOrderResult =
  | { kind: "created"; order: StoredOrder }
  | { kind: "existing"; order: StoredOrder }
  | { kind: "idempotency_conflict" }
  | { kind: "rate_limited" };

export type MarkPaidResult =
  | "marked_paid"
  | "already_paid"
  | "unknown_session"
  | "reference_mismatch"
  | "mode_mismatch"
  | "amount_mismatch"
  | "not_payable";

export type SheetJob = {
  jobId: number;
  attempts: number;
  order: StoredOrder & {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryAddress: CustomerDetails["address"];
  };
  items: { handle: string; name: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number }[];
};

export interface OrderRepository {
  createOrder(order: NewOrder, limits: { rateLimit: number; windowSeconds: number }): Promise<CreateOrderResult>;
  attachSession(orderId: string, sessionId: string): Promise<boolean>;
  markSessionFailed(orderId: string): Promise<void>;
  /** false when this provider event was already fully processed. */
  recordEvent(event: { id: string; type: string; livemode: boolean; sessionId: string | null }): Promise<{ duplicate: boolean }>;
  finishEvent(eventId: string, orderId: string | null, outcome: "applied" | "ignored" | "rejected", detail: string): Promise<void>;
  markPaid(input: {
    sessionId: string;
    reference: string;
    mode: OrderMode;
    amountMinor: number;
    currency: string;
    paymentId: string | null;
  }): Promise<{ result: MarkPaidResult; orderId: string | null }>;
  orderStatus(reference: string, accessTokenHash: string): Promise<StoredOrder | null>;
  claimSheetJobs(limit: number): Promise<SheetJob[]>;
  completeSheetJob(jobId: number, range: string): Promise<void>;
  failSheetJob(jobId: number, error: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

type Row = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

export function toStoredOrder(row: Row): StoredOrder {
  return {
    id: str(row.id),
    reference: str(row.reference),
    mode: row.mode === "live" ? "live" : "test",
    currency: "PHP",
    subtotalMinor: num(row.subtotal_minor),
    shippingMinor: row.shipping_minor === null || row.shipping_minor === undefined ? null : num(row.shipping_minor),
    totalMinor: num(row.total_minor),
    paymentMethod: row.payment_method === "cod" ? "cod" : "online",
    paymentStatus: str(row.payment_status),
    fulfillmentStatus: str(row.fulfillment_status),
    sheetSyncStatus: str(row.sheet_sync_status),
    providerSessionId: typeof row.provider_session_id === "string" ? row.provider_session_id : null,
    createdAt: str(row.created_at),
  };
}

export class SupabaseOrderRepository implements OrderRepository {
  constructor(
    private readonly config: SupabaseConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const headers: Record<string, string> = {
      apikey: this.config.serviceRoleKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    // Legacy service-role keys are JWTs and also go in Authorization; the
    // newer sb_secret_ keys are sent only as apikey.
    if (this.config.serviceRoleKey.startsWith("eyJ")) {
      headers.Authorization = `Bearer ${this.config.serviceRoleKey}`;
    }
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.config.url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers,
        body: JSON.stringify(args),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      throw new RepositoryError(`Order database unreachable (${fn}): ${(error as Error).name}`, null);
    }
    if (!response.ok) {
      // The body may echo submitted values; only the status is surfaced.
      throw new RepositoryError(`Order database error (${fn}): HTTP ${response.status}`, response.status);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  async createOrder(order: NewOrder, limits: { rateLimit: number; windowSeconds: number }) {
    const result = await this.rpc<Row>("checkout_create_order", {
      p_order: {
        reference: order.reference,
        idempotency_key: order.idempotencyKey,
        request_hash: order.requestHash,
        access_token_hash: order.accessTokenHash,
        mode: order.mode,
        currency: order.currency,
        subtotal_minor: order.subtotalMinor,
        shipping_minor: order.shippingMinor,
        total_minor: order.totalMinor,
        uses_sample_prices: order.usesSamplePrices,
        customer_name: order.customer.fullName,
        customer_phone: order.customer.phone,
        customer_email: order.customer.email,
        delivery_address: order.customer.address,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        fulfillment_status: order.fulfillmentStatus,
        client_fingerprint: order.clientFingerprint,
      },
      p_items: order.lines.map((line) => ({
        product_handle: line.handle,
        product_name: line.name,
        price_kind: line.priceKind,
        unit_price_minor: line.unitPriceMinor,
        quantity: line.quantity,
        line_total_minor: line.lineTotalMinor,
        currency: line.currency,
      })),
      p_rate_limit: limits.rateLimit,
      p_rate_window_seconds: limits.windowSeconds,
    });
    if (result.error === "idempotency_conflict") return { kind: "idempotency_conflict" } as const;
    if (result.error === "rate_limited") return { kind: "rate_limited" } as const;
    const stored = toStoredOrder(result.order as Row);
    return result.created ? ({ kind: "created", order: stored } as const) : ({ kind: "existing", order: stored } as const);
  }

  async attachSession(orderId: string, sessionId: string) {
    const result = await this.rpc<Row>("checkout_attach_session", { p_order_id: orderId, p_session_id: sessionId });
    return result.ok === true;
  }

  async markSessionFailed(orderId: string) {
    await this.rpc("checkout_mark_session_failed", { p_order_id: orderId });
  }

  async recordEvent(event: { id: string; type: string; livemode: boolean; sessionId: string | null }) {
    const result = await this.rpc<Row>("checkout_record_event", {
      p_provider_event_id: event.id,
      p_event_type: event.type,
      p_livemode: event.livemode,
      p_session_id: event.sessionId,
    });
    return { duplicate: result.duplicate === true };
  }

  async finishEvent(eventId: string, orderId: string | null, outcome: "applied" | "ignored" | "rejected", detail: string) {
    await this.rpc("checkout_finish_event", {
      p_provider_event_id: eventId,
      p_order_id: orderId,
      p_outcome: outcome,
      p_detail: detail,
    });
  }

  async markPaid(input: {
    sessionId: string;
    reference: string;
    mode: OrderMode;
    amountMinor: number;
    currency: string;
    paymentId: string | null;
  }) {
    const result = await this.rpc<Row>("checkout_mark_paid", {
      p_session_id: input.sessionId,
      p_reference: input.reference,
      p_mode: input.mode,
      p_amount_minor: input.amountMinor,
      p_currency: input.currency,
      p_payment_id: input.paymentId,
    });
    return {
      result: str(result.result) as MarkPaidResult,
      orderId: typeof result.order_id === "string" ? result.order_id : null,
    };
  }

  async orderStatus(reference: string, accessTokenHash: string) {
    const row = await this.rpc<Row | null>("checkout_order_status", {
      p_reference: reference,
      p_access_token_hash: accessTokenHash,
    });
    return row ? toStoredOrder(row) : null;
  }

  async claimSheetJobs(limit: number) {
    const rows = await this.rpc<Row[]>("sheet_sync_claim", { p_limit: limit, p_lease_seconds: 120 });
    return (rows ?? []).map((row) => {
      const order = row.order as Row;
      const items = (row.items as Row[] | null) ?? [];
      return {
        jobId: num(row.job_id),
        attempts: num(row.attempts),
        order: {
          ...toStoredOrder(order),
          customerName: str(order.customer_name),
          customerPhone: str(order.customer_phone),
          customerEmail: str(order.customer_email),
          deliveryAddress: order.delivery_address as CustomerDetails["address"],
        },
        items: items.map((item) => ({
          handle: str(item.product_handle),
          name: str(item.product_name),
          quantity: num(item.quantity),
          unitPriceMinor: num(item.unit_price_minor),
          lineTotalMinor: num(item.line_total_minor),
        })),
      };
    });
  }

  async completeSheetJob(jobId: number, range: string) {
    await this.rpc("sheet_sync_complete", { p_job_id: jobId, p_range: range });
  }

  async failSheetJob(jobId: number, error: string) {
    await this.rpc("sheet_sync_fail", { p_job_id: jobId, p_error: error });
  }
}
