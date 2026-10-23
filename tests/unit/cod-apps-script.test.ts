import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash, createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createOrder, getOrderStatus, processSheetOutbox, type CheckoutDeps } from "@/lib/server/checkout";
import { resolveCheckoutConfig } from "@/lib/server/config";
import {
  AppsScriptSheetsClient,
  buildCodPayload,
  signEnvelope,
  type CodSheetPayload,
} from "@/lib/server/sheets";
import type { SheetJob } from "@/lib/server/repository";
import { MemoryOrderRepository } from "../support/memory-repo";

// Mocked Google: the real apps-script/cod-orders/Code.gs runs in a sandbox
// with fake SpreadsheetApp, LockService, PropertiesService, Utilities and
// ContentService, behind a fake web-app endpoint that answers the way Apps
// Script does (POST → 302 → JSON at script.googleusercontent.com). No Google
// service, sheet or database is contacted here. Fake cells store values as
// given, so these tests show what the script writes, not how a real sheet
// renders it.

const SECRET = "test-signing-secret-0123456789abcdef";
const EXEC = "https://script.google.com/macros/s/AKfycbTestDeploymentId0123456789/exec";
const CODE = readFileSync(path.resolve(__dirname, "../../apps-script/cod-orders/Code.gs"), "utf8");

class FakeSheet {
  cells: string[][] = [];
  formats: { row: number; format: string }[] = [];
  getLastRow() {
    return this.cells.length;
  }
  getRange(row: number, col: number, rows: number, cols: number) {
    return new FakeRange(this, row, col, rows, cols);
  }
  setFrozenRows() {}
}

class FakeRange {
  constructor(
    private sheet: FakeSheet,
    private row: number,
    private col: number,
    private rows: number,
    private cols: number,
  ) {}
  setNumberFormat(format: string) {
    this.sheet.formats.push({ row: this.row, format });
    return this;
  }
  setFontWeight() {
    return this;
  }
  setValues(values: unknown[][]) {
    if (values.length !== this.rows || values.some((r) => r.length !== this.cols)) throw new Error("range size mismatch");
    values.forEach((v, i) => {
      const target = (this.sheet.cells[this.row - 1 + i] ??= []);
      v.forEach((cell, j) => {
        if (typeof cell !== "string") throw new Error("non-text cell");
        target[this.col - 1 + j] = cell;
      });
    });
    return this;
  }
  getDisplayValues() {
    return Array.from({ length: this.rows }, (_, i) =>
      Array.from({ length: this.cols }, (_, j) => this.sheet.cells[this.row - 1 + i]?.[this.col - 1 + j] ?? ""),
    );
  }
  createTextFinder(text: string) {
    const sheet = this.sheet;
    const { row, rows, col } = this;
    const all = () => {
      const found: { getRow: () => number }[] = [];
      for (let r = row; r < row + rows; r++) {
        if (sheet.cells[r - 1]?.[col - 1] === text) found.push({ getRow: () => r });
      }
      return found;
    };
    const finder = {
      matchCase: () => finder,
      matchEntireCell: () => finder,
      findNext: () => all()[0] ?? null,
      findAll: all,
    };
    return finder;
  }
}

type Receiver = { doPost: (e: unknown) => { getContent(): string }; setupOrdersTab: () => void };

function loadReceiver(options: { secret?: string | null; tab?: string } = {}) {
  const sheets = new Map<string, FakeSheet>();
  const errors: string[] = [];
  const lock = { held: false, heldElsewhere: false };
  const props: Record<string, string | null> = {
    COD_SIGNING_SECRET: options.secret === undefined ? SECRET : options.secret,
    ORDERS_TAB: options.tab ?? null,
  };
  const context = vm.createContext({
    console: { error: (m: string) => errors.push(m), log: () => undefined },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (lock.held) throw new Error("lock re-entered: executions overlapped");
          if (lock.heldElsewhere) return false;
          lock.held = true;
          return true;
        },
        waitLock: () => {
          lock.held = true;
        },
        releaseLock: () => {
          lock.held = false;
        },
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name: string) => sheets.get(name) ?? null,
        insertSheet: (name: string) => {
          const sheet = new FakeSheet();
          sheets.set(name, sheet);
          return sheet;
        },
      }),
      flush: () => undefined,
    },
    Utilities: {
      Charset: { UTF_8: "UTF-8" },
      DigestAlgorithm: { SHA_256: "SHA_256" },
      computeDigest: (_algorithm: string, value: string) =>
        Array.from(createHash("sha256").update(Buffer.from(value, "utf8")).digest(), (b) => (b > 127 ? b - 256 : b)),
      // Java-style signed bytes, as Apps Script returns them.
      computeHmacSha256Signature: (value: string, key: string) =>
        Array.from(createHmac("sha256", Buffer.from(key, "utf8")).update(Buffer.from(value, "utf8")).digest(), (b) =>
          b > 127 ? b - 256 : b,
        ),
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text: string) => ({ getContent: () => text, setMimeType() { return this; } }),
    },
  });
  vm.runInContext(CODE, context, { filename: "Code.gs" });
  const receiver = context as unknown as Receiver;
  const tab = () => sheets.get(options.tab ?? "Test orders");
  return { receiver, tab, errors, lock };
}

type Google = ReturnType<typeof loadReceiver>;
type Mode = "ok" | "login" | "html" | "malformed" | "wrong-id" | "hang" | "status-500";

/** Behaves like a deployed web app: runs doPost, then redirects to the echo host. */
function googleFetch(google: Google, state: { mode: Mode; posts: number }) {
  const echoes = new Map<string, string>();
  return (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input);
    expect(init.redirect).toBe("manual");
    if (state.mode === "hang") {
      return new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)));
    }
    if (init.method === "POST") {
      expect(url).toBe(EXEC);
      state.posts += 1;
      if (state.mode === "login") {
        return new Response(null, { status: 302, headers: { location: "https://accounts.google.com/ServiceLogin?continue=x" } });
      }
      if (state.mode === "status-500") return new Response("error", { status: 500 });
      const out = google.receiver.doPost({ postData: { contents: String(init.body), type: "application/json" } });
      const key = `k${echoes.size + 1}`;
      echoes.set(key, out.getContent());
      return new Response(null, {
        status: 302,
        headers: { location: `https://script.googleusercontent.com/macros/echo?user_content_key=${key}&lib=x` },
      });
    }
    const key = new URL(url).searchParams.get("user_content_key")!;
    const text = echoes.get(key)!;
    if (state.mode === "html") {
      return new Response("<!DOCTYPE html><html><body>Sign in</body></html>", { status: 200, headers: { "content-type": "text/html" } });
    }
    if (state.mode === "malformed") return new Response("{not json", { status: 200, headers: { "content-type": "application/json" } });
    if (state.mode === "wrong-id") {
      const ack = JSON.parse(text);
      return Response.json({ ...ack, orderId: "AD-T-ZZZZZZZZ" });
    }
    return new Response(text, { status: 200, headers: { "content-type": "application/json; charset=utf-8" } });
  }) as typeof fetch;
}

const PAYLOAD: CodSheetPayload = {
  orderId: "AD-T-7K3M9Q2X",
  createdAt: "2026-10-23T08:00:00.000Z",
  mode: "test",
  orderStatus: "awaiting_confirmation",
  paymentMethod: "cod",
  paymentStatus: "cod_pending",
  customer: { name: "TEST Fictitious Customer", mobile: "09170000000", email: "test@example.invalid" },
  address: { street: "=HYPERLINK(\"http://evil\")", barangay: "+Test", city: "Test City", province: "Test Province", postalCode: "0400", notes: "@leave at gate" },
  items: [
    { name: "Hair Fall Defense Shampoo", quantity: 2, unitPrice: "1299.00", lineTotal: "2598.00" },
    { name: "Scalp Balance Daily Shampoo", quantity: 1, unitPrice: "1299.00", lineTotal: "1299.00" },
  ],
  totalQuantity: 3,
  currency: "PHP",
  subtotal: "3897.00",
  deliveryFee: null,
  total: "3897.00",
};

const nowSeconds = () => Math.floor(Date.now() / 1000);
const post = (google: Google, envelope: unknown) =>
  JSON.parse(google.receiver.doPost({ postData: { contents: JSON.stringify(envelope) } }).getContent());
const signed = (payload: unknown, ts = nowSeconds(), secret = SECRET) => signEnvelope(secret, JSON.stringify(payload), ts);

let google: Google;
let state: { mode: Mode; posts: number };
let client: AppsScriptSheetsClient;

beforeEach(() => {
  google = loadReceiver();
  state = { mode: "ok", posts: 0 };
  client = new AppsScriptSheetsClient({ endpoint: EXEC, signingSecret: SECRET }, googleFetch(google, state), Date.now, 200);
});

describe("Apps Script receiver", () => {
  it("writes one row for a valid signed test order, with the documented columns", async () => {
    const ack = await client.deliver(PAYLOAD);
    expect(ack).toEqual({ orderId: PAYLOAD.orderId, result: "created", row: 2 });
    const [header, row] = google.tab()!.cells;
    expect(header).toEqual([
      "Order ID", "Created At", "Mode", "Order Status", "Payment Method", "Payment Status",
      "Customer Name", "Mobile", "Email", "Street Address", "Barangay", "City", "Province", "Postal Code",
      "Items", "Total Quantity", "Currency", "Subtotal", "Delivery Fee", "Total", "Delivery Notes",
      "Staff Status", "Staff Notes",
    ]);
    expect(row).toEqual([
      "AD-T-7K3M9Q2X", "2026-10-23T08:00:00.000Z", "TEST", "awaiting_confirmation", "Cash on delivery", "cod_pending",
      "TEST Fictitious Customer", "09170000000", "test@example.invalid",
      "'=HYPERLINK(\"http://evil\")", "'+Test", "Test City", "Test Province", "0400",
      "2 × Hair Fall Defense Shampoo @ 1299.00; 1 × Scalp Balance Daily Shampoo @ 1299.00",
      "3", "PHP", "3897.00", "Unknown (not configured)", "3897.00 + delivery (unknown)", "'@leave at gate",
    ]);
    // Plain-text format is applied to the row before values are written.
    expect(google.tab()!.formats).toContainEqual({ row: 2, format: "@" });
    expect(row.join(" ")).not.toMatch(/\bFree\b/);
  });

  it("shows a configured delivery fee and total as numbers", async () => {
    await client.deliver({ ...PAYLOAD, deliveryFee: "150.00", total: "4047.00" });
    const row = google.tab()!.cells[1];
    expect(row.slice(17, 20)).toEqual(["3897.00", "150.00", "4047.00"]);
  });

  it("acknowledges a repeated order ID without a second row or touching staff columns", async () => {
    await client.deliver(PAYLOAD);
    google.tab()!.cells[1][21] = "Confirmed by phone";
    google.tab()!.cells[1][22] = "Call after 5pm";
    const again = await client.deliver({ ...PAYLOAD, customer: { ...PAYLOAD.customer, name: "Changed" } });
    expect(again).toEqual({ orderId: PAYLOAD.orderId, result: "duplicate", row: 2 });
    expect(google.tab()!.cells).toHaveLength(2);
    expect(google.tab()!.cells[1][6]).toBe("TEST Fictitious Customer");
    expect(google.tab()!.cells[1].slice(21)).toEqual(["Confirmed by phone", "Call after 5pm"]);
  });

  it("concurrent deliveries of one order serialize on the lock and leave one row", async () => {
    const results = await Promise.all([client.deliver(PAYLOAD), client.deliver(PAYLOAD), client.deliver(PAYLOAD)]);
    expect(results.map((r) => r.result).sort()).toEqual(["created", "duplicate", "duplicate"]);
    expect(google.tab()!.cells.filter((r) => r[0] === PAYLOAD.orderId)).toHaveLength(1);
    expect(google.lock.held).toBe(false);
  });

  it("answers busy, writing nothing, while another execution holds the lock", async () => {
    google.lock.heldElsewhere = true;
    await expect(client.deliver(PAYLOAD)).rejects.toThrow("Apps Script refused the order: busy");
    expect(google.tab()).toBeUndefined();
  });

  it("rejects a bad signature, a wrong secret and a tampered payload", () => {
    const good = signed(PAYLOAD);
    expect(post(google, { ...good, sig: "0".repeat(64) })).toEqual({ ok: false, error: "unauthorized" });
    expect(post(google, signed(PAYLOAD, nowSeconds(), "another-secret-0123456789abcdefghij"))).toEqual({ ok: false, error: "unauthorized" });
    expect(post(google, { ...good, payload: good.payload.replace("3897.00", "1.00") })).toEqual({ ok: false, error: "unauthorized" });
    expect(post(google, { ...good, ts: String(Number(good.ts) + 1) })).toEqual({ ok: false, error: "unauthorized" });
    expect(post(google, { ...good, sig: "nothex" })).toEqual({ ok: false, error: "unauthorized" });
    expect(google.tab()).toBeUndefined();
  });

  it("rejects expired and future timestamps even when correctly signed", async () => {
    expect(post(google, signed(PAYLOAD, nowSeconds() - 301))).toEqual({ ok: false, error: "stale_request" });
    expect(post(google, signed(PAYLOAD, nowSeconds() + 61))).toEqual({ ok: false, error: "stale_request" });
    expect(post(google, signed(PAYLOAD, nowSeconds() - 290)).ok).toBe(true);

    const late = new AppsScriptSheetsClient({ endpoint: EXEC, signingSecret: SECRET }, googleFetch(google, state), () => Date.now() - 600_000);
    await expect(late.deliver({ ...PAYLOAD, orderId: "AD-T-ABCDEFGH" })).rejects.toThrow("refused the order: stale_request");
  });

  it("rejects live orders, inconsistent totals, bad phones and oversized bodies", () => {
    expect(post(google, signed({ ...PAYLOAD, mode: "live" }))).toEqual({ ok: false, error: "mode_not_allowed" });
    expect(post(google, signed({ ...PAYLOAD, orderId: "AD-L-7K3M9Q2X" }))).toEqual({ ok: false, error: "mode_not_allowed" });
    expect(post(google, signed({ ...PAYLOAD, total: "3000.00" }))).toEqual({ ok: false, error: "invalid_request" });
    expect(post(google, signed({ ...PAYLOAD, totalQuantity: 4 }))).toEqual({ ok: false, error: "invalid_request" });
    expect(post(google, signed({ ...PAYLOAD, customer: { ...PAYLOAD.customer, mobile: "+639170000000" } }))).toEqual({ ok: false, error: "invalid_request" });
    expect(post(google, signed({ ...PAYLOAD, items: [{ ...PAYLOAD.items[0], quantity: 11, lineTotal: "14289.00" }] }))).toEqual({ ok: false, error: "invalid_request" });
    expect(post(google, signed({ ...PAYLOAD, address: { ...PAYLOAD.address, notes: "x".repeat(301) } }))).toEqual({ ok: false, error: "invalid_request" });
    expect(JSON.parse(google.receiver.doPost({ postData: { contents: "x".repeat(16385) } }).getContent())).toEqual({ ok: false, error: "invalid_request" });
    expect(JSON.parse(google.receiver.doPost({ postData: { contents: "{" } }).getContent())).toEqual({ ok: false, error: "invalid_request" });
    expect(JSON.parse(google.receiver.doPost({}).getContent())).toEqual({ ok: false, error: "invalid_request" });
    expect(google.tab()).toBeUndefined();
  });

  it("refuses everything until the signing secret is set, and its errors carry no personal data", () => {
    const unconfigured = loadReceiver({ secret: null });
    expect(post(unconfigured, signed(PAYLOAD))).toEqual({ ok: false, error: "not_configured" });
    const short = loadReceiver({ secret: "too-short" });
    expect(post(short, signed(PAYLOAD, nowSeconds(), "too-short"))).toEqual({ ok: false, error: "not_configured" });

    const broken = loadReceiver();
    // Force a failure inside the write path.
    (broken.receiver as unknown as { SpreadsheetApp: unknown }).SpreadsheetApp = { getActiveSpreadsheet: () => null };
    expect(post(broken, signed(PAYLOAD))).toEqual({ ok: false, error: "server_error" });
    expect(broken.errors.join(" ")).not.toMatch(/Fictitious|0917|example\.invalid|HYPERLINK/);
    expect(broken.lock.held).toBe(false);
  });

  it("signed lookup reports rows and digests without writing, and a replay leaves the row unchanged", async () => {
    const lookup = () => post(google, signed({ action: "lookup", orderId: PAYLOAD.orderId }));
    expect(lookup()).toEqual({ ok: true, orderId: PAYLOAD.orderId, result: "lookup", rows: [] });
    await client.deliver(PAYLOAD);
    const before = lookup();
    expect(before.rows).toEqual([{ row: 2, digest: expect.stringMatching(/^[0-9a-f]{64}$/), staffFilled: false }]);
    google.tab()!.cells[1][22] = "Staff note";
    const noted = lookup();
    expect(noted.rows[0].staffFilled).toBe(true);
    expect(noted.rows[0].digest).not.toBe(before.rows[0].digest);
    expect((await client.deliver(PAYLOAD)).result).toBe("duplicate");
    expect(lookup().rows).toEqual(noted.rows);
    expect(JSON.stringify(noted)).not.toMatch(/Fictitious|0917|example\.invalid|Staff note/);
    expect(google.tab()!.cells).toHaveLength(2);

    expect(post(google, { ...signed({ action: "lookup", orderId: PAYLOAD.orderId }), sig: "0".repeat(64) })).toEqual({ ok: false, error: "unauthorized" });
    expect(post(google, signed({ action: "lookup", orderId: "x" }))).toEqual({ ok: false, error: "invalid_request" });
    // A lookup result is never accepted as a delivery acknowledgement.
    expect(post(google, signed({ action: "lookup", orderId: "AD-L-7K3M9Q2X" }))).toEqual({ ok: false, error: "invalid_request" });
  });

  it("uses the configured tab name", async () => {
    google = loadReceiver({ tab: "QA orders" });
    client = new AppsScriptSheetsClient({ endpoint: EXEC, signingSecret: SECRET }, googleFetch(google, state));
    await client.deliver(PAYLOAD);
    expect(google.tab()!.cells).toHaveLength(2);
  });
});

describe("server client", () => {
  it("treats a sign-in redirect, HTML, malformed JSON, a mismatched ID and HTTP errors as failures", async () => {
    for (const [mode, message] of [
      ["login", "redirected away from Google's response host"],
      ["html", "returned HTML"],
      ["malformed", "not a JSON object"],
      ["wrong-id", "different order ID"],
      ["status-500", "HTTP 500"],
    ] as [Mode, string][]) {
      state.mode = mode;
      await expect(client.deliver(PAYLOAD), mode).rejects.toThrow(message);
    }
  });

  it("gives up after its deadline", async () => {
    state.mode = "hang";
    const started = Date.now();
    await expect(client.deliver(PAYLOAD)).rejects.toThrow("Apps Script timed out");
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("signs the exact payload text with the timestamp", () => {
    const envelope = signEnvelope(SECRET, '{"a":"ñ"}', 1700000000);
    expect(envelope).toEqual({
      v: 1,
      ts: "1700000000",
      payload: '{"a":"ñ"}',
      sig: createHmac("sha256", SECRET).update('1700000000.{"a":"ñ"}', "utf8").digest("hex"),
    });
  });

  it("never builds a payload for a live order", () => {
    const job = { jobId: 1, attempts: 1, order: { mode: "live" }, items: [] } as unknown as SheetJob;
    expect(() => buildCodPayload(job)).toThrow("live orders are not supported");
  });
});

describe("checkout → outbox → Apps Script (mocked Google, in-memory database)", () => {
  const ENV = {
    CHECKOUT_MODE: "test",
    SUPABASE_URL: "https://brrydhnpwkfejehksdkn.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    COD_SHEET_APPS_SCRIPT_URL: EXEC,
    COD_SHEET_SIGNING_SECRET: SECRET,
  };
  const input = {
    idempotencyKey: "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0",
    acknowledgeTestMode: true,
    paymentMethod: "cod",
    lines: [{ handle: "hair-fall-defense-shampoo", quantity: 2 }],
    expectedSubtotalMinor: 259800,
    customer: {
      fullName: "TEST Fictitious Customer",
      phone: "0917 000 0000",
      email: "test@example.invalid",
      address: { line1: "=1+1 Test St", barangay: "Test", city: "Test City", province: "Test Province", postalCode: "0400", notes: "" },
    },
  };

  it("keeps a COD order through a Google outage, then syncs exactly one row with server totals", async () => {
    const repo = new MemoryOrderRepository();
    const deps: CheckoutDeps = { config: resolveCheckoutConfig(ENV), repo, paymongo: null, sheets: client, log: () => undefined };
    const placed = await createOrder(input, { clientIp: null, origin: "https://auraderm.test" }, deps);
    expect(placed.status).toBe(201);
    const reference = String(placed.body.reference);

    state.mode = "html";
    expect(await processSheetOutbox(deps)).toMatchObject({ claimed: 1, synced: 0, failed: 1 });
    expect(repo.byReference(reference)).toMatchObject({ paymentStatus: "cod_pending", sheetSyncStatus: "failed" });
    expect((await getOrderStatus({ reference, token: String(placed.body.token) }, deps)).body.storeNotified).toBe(false);

    state.mode = "ok";
    expect(await processSheetOutbox(deps)).toMatchObject({ synced: 1, failed: 0 });
    // A replay of the same order (e.g. a lost acknowledgement) is a duplicate.
    expect((await client.deliver(buildCodPayload((await repoJob(repo, reference))!))).result).toBe("duplicate");

    const rows = google.tab()!.cells.filter((r) => r[0] === reference);
    expect(rows).toHaveLength(1);
    expect(rows[0][7]).toBe("09170000000");
    expect(rows[0][9]).toBe("'=1+1 Test St");
    expect(rows[0].slice(15, 20)).toEqual(["2", "PHP", "2598.00", "Unknown (not configured)", "2598.00 + delivery (unknown)"]);
    expect(repo.byReference(reference)!.sheetSyncStatus).toBe("synced");
    expect((await getOrderStatus({ reference, token: String(placed.body.token) }, deps)).body.storeNotified).toBe(true);
  });
});

// Rebuilds the job the outbox would send, for the replay check.
async function repoJob(repo: MemoryOrderRepository, reference: string) {
  const job = repo.jobs.find((j) => repo.byReference(reference)!.id === j.orderId)!;
  job.status = "pending";
  const [claimed] = await repo.claimSheetJobs(1);
  return claimed;
}

describe("configuration", () => {
  const sheetsFor = (url: string, secret = SECRET) => {
    const config = resolveCheckoutConfig({ COD_SHEET_APPS_SCRIPT_URL: url, COD_SHEET_SIGNING_SECRET: secret });
    return { sheets: config.sheets, issues: config.issues.join(" ") };
  };

  it("accepts only a deployed /exec web app URL and a long secret", () => {
    expect(sheetsFor(EXEC).sheets).toEqual({ endpoint: EXEC, signingSecret: SECRET });
    expect(sheetsFor("https://script.google.com/a/macros/example.com/s/AKfycbTestDeploymentId0123456789/exec").sheets).not.toBeNull();
    expect(sheetsFor(EXEC.replace(/exec$/, "dev")).issues).toMatch(/ending in \/exec \(not \/dev\)/);
    expect(sheetsFor(EXEC.replace("script.google.com", "evil.example")).sheets).toBeNull();
    expect(sheetsFor(EXEC.replace("https:", "http:")).sheets).toBeNull();
    expect(sheetsFor(`${EXEC}?x=1`).sheets).toBeNull();
    expect(sheetsFor(EXEC, "short").issues).toMatch(/at least 32 characters/);
    expect(sheetsFor("", SECRET).sheets).toBeNull();
  });

  it("never exposes the endpoint or secret in the browser status", async () => {
    const { publicCheckoutStatus } = await import("@/lib/server/config");
    const status = publicCheckoutStatus(
      resolveCheckoutConfig({
        CHECKOUT_MODE: "test",
        SUPABASE_URL: "https://brrydhnpwkfejehksdkn.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
        COD_SHEET_APPS_SCRIPT_URL: EXEC,
        COD_SHEET_SIGNING_SECRET: SECRET,
      }),
    );
    expect(status).toMatchObject({ mode: "test", codAvailable: true, onlineAvailable: false });
    expect(JSON.stringify(status)).not.toMatch(/script\.google|AKfyc|signing-secret|COD_SHEET/);
  });
});
