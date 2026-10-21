import "server-only";
import { createSign } from "node:crypto";
import type { SheetsConfig } from "@/lib/server/config";
import type { SheetJob } from "@/lib/server/repository";
import { formatAddress } from "@/lib/checkout/customer";

// Google Sheets order log for cash-on-delivery orders, written server-side
// with a service account the owner shares their sheet with. Values are sent
// with valueInputOption=RAW, so customer-supplied text is stored literally and
// is never parsed as a formula. Each order reference is looked up in column A
// before appending, so a retried sync does not normally add a second row.

export const SHEET_COLUMNS = [
  "order_id",
  "created_at",
  "mode",
  "customer_name",
  "phone",
  "email",
  "delivery_address",
  "items",
  "currency",
  "subtotal",
  "shipping",
  "total",
  "payment_method",
  "payment_status",
  "fulfillment_status",
] as const;

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

const decimal = (minor: number) => (minor / 100).toFixed(2);

export function buildSheetRow(job: SheetJob): string[] {
  const { order } = job;
  const items = job.items.map((i) => `${i.quantity} × ${i.name} @ ${decimal(i.unitPriceMinor)}`).join("; ");
  return [
    order.reference,
    order.createdAt,
    order.mode === "test" ? "TEST" : "LIVE",
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    formatAddress(order.deliveryAddress) + (order.deliveryAddress.notes ? ` (Notes: ${order.deliveryAddress.notes})` : ""),
    items,
    order.currency,
    decimal(order.subtotalMinor),
    order.shippingMinor === null ? "not configured" : decimal(order.shippingMinor),
    decimal(order.totalMinor),
    order.paymentMethod === "cod" ? "COD" : "online",
    order.paymentStatus,
    order.fulfillmentStatus,
  ];
}

/** A1 range for a whole tab, with the tab name quoted. */
export function tabRange(tab: string, columns = "A:O"): string {
  return `'${tab.replace(/'/g, "''")}'!${columns}`;
}

export interface SheetsClient {
  /** Values of column A in the tab (order references and the header). */
  readOrderIds(tab: string): Promise<string[]>;
  appendRows(tab: string, rows: string[][]): Promise<string>;
}

export class SheetsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsError";
  }
}

const base64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

export class GoogleSheetsClient implements SheetsClient {
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly config: SheetsConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async accessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.expiresAt - 60 > now) return this.token.value;
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = base64url(
      JSON.stringify({ iss: this.config.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
    );
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claims}`);
    const assertion = `${header}.${claims}.${base64url(signer.sign(this.config.privateKey))}`;
    const response = await this.fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new SheetsError(`Google auth failed: HTTP ${response.status}`);
    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new SheetsError("Google auth returned no token");
    this.token = { value: body.access_token, expiresAt: now + (body.expires_in ?? 3600) };
    return body.access_token;
  }

  private async call(path: string, init: RequestInit = {}) {
    const token = await this.accessToken();
    const response = await this.fetchImpl(`${API}/${encodeURIComponent(this.config.spreadsheetId)}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new SheetsError(`Google Sheets HTTP ${response.status}`);
    return (await response.json()) as Record<string, unknown>;
  }

  async readOrderIds(tab: string) {
    const body = await this.call(`/values/${encodeURIComponent(tabRange(tab, "A:A"))}?majorDimension=COLUMNS`);
    const values = body.values as string[][] | undefined;
    return values?.[0] ?? [];
  }

  async appendRows(tab: string, rows: string[][]) {
    const body = await this.call(
      `/values/${encodeURIComponent(tabRange(tab))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: "POST", body: JSON.stringify({ majorDimension: "ROWS", values: rows }) },
    );
    const updates = body.updates as { updatedRange?: string } | undefined;
    return updates?.updatedRange ?? tabRange(tab);
  }
}
