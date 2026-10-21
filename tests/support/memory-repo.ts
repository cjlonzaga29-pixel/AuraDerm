import type {
  CreateOrderResult,
  MarkPaidResult,
  NewOrder,
  OrderRepository,
  SheetJob,
  StoredOrder,
} from "@/lib/server/repository";

// In-memory stand-in for the Supabase RPC functions, mirroring their rules
// (supabase/migrations/20261021120000_checkout_foundation.sql). Used by the
// mocked adapter tests only; it proves the service logic, not the SQL.
type Row = StoredOrder & { input: NewOrder; paidAt: string | null; paymentId: string | null };
type Job = { id: number; orderId: string; status: string; attempts: number; range: string | null; error: string | null };
type EventRow = { id: string; outcome: string; orderId: string | null; detail: string | null };

export class MemoryOrderRepository implements OrderRepository {
  orders: Row[] = [];
  jobs: Job[] = [];
  events = new Map<string, EventRow>();
  failNextCreate = false;
  private seq = 0;

  async createOrder(order: NewOrder, limits: { rateLimit: number; windowSeconds: number }): Promise<CreateOrderResult> {
    if (this.failNextCreate) {
      this.failNextCreate = false;
      throw new Error("Order database unreachable (checkout_create_order): TypeError");
    }
    const existing = this.orders.find((o) => o.input.idempotencyKey === order.idempotencyKey);
    if (existing) {
      if (existing.input.requestHash !== order.requestHash) return { kind: "idempotency_conflict" };
      return { kind: "existing", order: this.view(existing) };
    }
    if (order.clientFingerprint) {
      const recent = this.orders.filter((o) => o.input.clientFingerprint === order.clientFingerprint).length;
      if (recent >= limits.rateLimit) return { kind: "rate_limited" };
    }
    const row: Row = {
      id: `order-${++this.seq}`,
      reference: order.reference,
      mode: order.mode,
      currency: "PHP",
      subtotalMinor: order.subtotalMinor,
      shippingMinor: order.shippingMinor,
      totalMinor: order.totalMinor,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      sheetSyncStatus: order.paymentMethod === "cod" ? "pending" : "not_required",
      providerSessionId: null,
      createdAt: new Date(Date.UTC(2026, 9, 21, 10, this.seq)).toISOString(),
      input: order,
      paidAt: null,
      paymentId: null,
    };
    this.orders.push(row);
    if (order.paymentMethod === "cod") {
      this.jobs.push({ id: this.jobs.length + 1, orderId: row.id, status: "pending", attempts: 0, range: null, error: null });
    }
    return { kind: "created", order: this.view(row) };
  }

  private view(row: Row): StoredOrder {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { input, paidAt, paymentId, ...stored } = row;
    return { ...stored };
  }

  byReference(reference: string) {
    return this.orders.find((o) => o.reference === reference);
  }

  async attachSession(orderId: string, sessionId: string) {
    const row = this.orders.find((o) => o.id === orderId);
    if (!row || row.paymentMethod !== "online") return false;
    if (row.providerSessionId && row.providerSessionId !== sessionId) return false;
    row.providerSessionId = sessionId;
    if (row.paymentStatus === "session_failed") row.paymentStatus = "awaiting_payment";
    return true;
  }

  async markSessionFailed(orderId: string) {
    const row = this.orders.find((o) => o.id === orderId);
    if (row && row.paymentStatus === "awaiting_payment" && !row.providerSessionId) row.paymentStatus = "session_failed";
  }

  async recordEvent(event: { id: string; type: string; livemode: boolean; sessionId: string | null }) {
    const existing = this.events.get(event.id);
    if (existing) return { duplicate: existing.outcome !== "received" };
    this.events.set(event.id, { id: event.id, outcome: "received", orderId: null, detail: null });
    return { duplicate: false };
  }

  async finishEvent(eventId: string, orderId: string | null, outcome: "applied" | "ignored" | "rejected", detail: string) {
    const row = this.events.get(eventId);
    if (row) Object.assign(row, { orderId, outcome, detail });
  }

  async markPaid(input: {
    sessionId: string;
    reference: string;
    mode: "test" | "live";
    amountMinor: number;
    currency: string;
    paymentId: string | null;
  }): Promise<{ result: MarkPaidResult; orderId: string | null }> {
    const row = this.orders.find((o) => o.providerSessionId === input.sessionId);
    if (!row) return { result: "unknown_session", orderId: null };
    if (row.paymentStatus === "paid") return { result: "already_paid", orderId: row.id };
    if (row.reference !== input.reference) return { result: "reference_mismatch", orderId: row.id };
    if (row.mode !== input.mode) return { result: "mode_mismatch", orderId: row.id };
    if (row.totalMinor !== input.amountMinor || row.currency !== input.currency) {
      return { result: "amount_mismatch", orderId: row.id };
    }
    if (row.paymentStatus !== "awaiting_payment" && row.paymentStatus !== "session_failed") {
      return { result: "not_payable", orderId: row.id };
    }
    row.paymentStatus = "paid";
    row.paidAt = "now";
    row.paymentId = input.paymentId;
    return { result: "marked_paid", orderId: row.id };
  }

  async orderStatus(reference: string, accessTokenHash: string) {
    const row = this.orders.find((o) => o.reference === reference && o.input.accessTokenHash === accessTokenHash);
    return row ? this.view(row) : null;
  }

  async claimSheetJobs(limit: number): Promise<SheetJob[]> {
    const due = this.jobs.filter((j) => j.status !== "synced").slice(0, limit);
    return due.map((job) => {
      job.status = "processing";
      job.attempts += 1;
      const row = this.orders.find((o) => o.id === job.orderId)!;
      return {
        jobId: job.id,
        attempts: job.attempts,
        order: {
          ...this.view(row),
          customerName: row.input.customer.fullName,
          customerPhone: row.input.customer.phone,
          customerEmail: row.input.customer.email,
          deliveryAddress: row.input.customer.address,
        },
        items: row.input.lines.map((l) => ({
          handle: l.handle,
          name: l.name,
          quantity: l.quantity,
          unitPriceMinor: l.unitPriceMinor,
          lineTotalMinor: l.lineTotalMinor,
        })),
      };
    });
  }

  async completeSheetJob(jobId: number, range: string) {
    const job = this.jobs.find((j) => j.id === jobId)!;
    Object.assign(job, { status: "synced", range, error: null });
    this.orders.find((o) => o.id === job.orderId)!.sheetSyncStatus = "synced";
  }

  async failSheetJob(jobId: number, error: string) {
    const job = this.jobs.find((j) => j.id === jobId)!;
    Object.assign(job, { status: "failed", error });
    this.orders.find((o) => o.id === job.orderId)!.sheetSyncStatus = "failed";
  }
}
