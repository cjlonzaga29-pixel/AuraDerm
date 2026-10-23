/**
 * @OnlyCurrentDoc
 *
 * AuraDerm — cash-on-delivery order receiver (Google Apps Script web app).
 *
 * The AuraDerm server (never a browser) POSTs one signed envelope per COD
 * order. This script verifies it and appends exactly one row per order ID to
 * the owner's private sheet. Setup: docs/cod-apps-script.md.
 *
 * Envelope (the request body, JSON):
 *   { "v": 1, "ts": "<unix seconds>", "sig": "<hex>", "payload": "<JSON text>" }
 * where sig = hex(HMAC-SHA256(secret, ts + "." + payload)) over UTF-8 bytes.
 * Apps Script does not expose request headers to doPost(e), so the timestamp
 * and signature travel in the body, and the payload is signed exactly as the
 * serialized text that was sent.
 *
 * Script Properties (Project Settings → Script properties):
 *   COD_SIGNING_SECRET  required; the same value as the server's
 *                       COD_SHEET_SIGNING_SECRET (at least 32 characters).
 *   ORDERS_TAB          optional; defaults to "Test orders".
 *
 * The script must be bound to the owner's sheet (Extensions → Apps Script in
 * that sheet). @OnlyCurrentDoc limits it to that one spreadsheet.
 *
 * Only test orders are accepted. Accepting live orders needs a code change
 * here and on the server.
 */

var COD = {
  VERSION: 1,
  ACCEPTED_MODES: ["test"],
  DEFAULT_TAB: "Test orders",
  MAX_BODY_CHARS: 16384,
  MAX_PAYLOAD_CHARS: 12288,
  MAX_AGE_SECONDS: 300,
  MAX_FUTURE_SECONDS: 60,
  LOCK_WAIT_MS: 20000,
  MIN_SECRET_CHARS: 32,
  COLUMNS: [
    "Order ID",
    "Created At",
    "Mode",
    "Order Status",
    "Payment Method",
    "Payment Status",
    "Customer Name",
    "Mobile",
    "Email",
    "Street Address",
    "Barangay",
    "City",
    "Province",
    "Postal Code",
    "Items",
    "Total Quantity",
    "Currency",
    "Subtotal",
    "Delivery Fee",
    "Total",
    "Delivery Notes",
    // Staff-only columns: never written or overwritten by this script.
    "Staff Status",
    "Staff Notes",
  ],
  WRITTEN_COLUMNS: 21,
};

// Matches the server's references for test orders: AD-T- plus 8 characters
// from an alphabet without 0/O/1/I.
var TEST_ORDER_ID = /^AD-T-[A-HJ-NP-Z2-9]{8}$/;
var MONEY = /^\d{1,9}\.\d{2}$/;

function doPost(e) {
  var orderId = null;
  try {
    var body = e && e.postData && typeof e.postData.contents === "string" ? e.postData.contents : "";
    if (!body || body.length > COD.MAX_BODY_CHARS) return reply_({ ok: false, error: "invalid_request" });

    var secret = PropertiesService.getScriptProperties().getProperty("COD_SIGNING_SECRET");
    if (!secret || secret.length < COD.MIN_SECRET_CHARS) return reply_({ ok: false, error: "not_configured" });

    var envelope = parseJson_(body);
    if (!envelope || envelope.v !== COD.VERSION) return reply_({ ok: false, error: "invalid_request" });
    var ts = envelope.ts;
    var sig = envelope.sig;
    var payloadText = envelope.payload;
    if (typeof ts !== "string" || !/^\d{9,11}$/.test(ts)) return reply_({ ok: false, error: "invalid_request" });
    if (typeof sig !== "string" || !/^[0-9a-f]{64}$/.test(sig)) return reply_({ ok: false, error: "unauthorized" });
    if (typeof payloadText !== "string" || payloadText.length > COD.MAX_PAYLOAD_CHARS) {
      return reply_({ ok: false, error: "invalid_request" });
    }

    // Authenticate before looking at the payload at all.
    if (!constantTimeEqual_(hmacHex_(ts + "." + payloadText, secret), sig)) {
      return reply_({ ok: false, error: "unauthorized" });
    }
    var age = Math.floor(Date.now() / 1000) - Number(ts);
    if (age > COD.MAX_AGE_SECONDS || age < -COD.MAX_FUTURE_SECONDS) {
      return reply_({ ok: false, error: "stale_request" });
    }

    var payload = parseJson_(payloadText);
    var check = validatePayload_(payload);
    if (!check.ok) return reply_({ ok: false, error: check.error });
    orderId = payload.orderId;

    return reply_(appendOnce_(payload));
  } catch (err) {
    // Error kind only: never the payload or customer details.
    console.error("cod-orders: " + (err && err.name ? err.name : "Error") + (orderId ? " for " + orderId : ""));
    return reply_({ ok: false, error: "server_error" });
  }
}

/** Run once from the editor to create the tab with its header row. */
function setupOrdersTab() {
  var lock = LockService.getScriptLock();
  lock.waitLock(COD.LOCK_WAIT_MS);
  try {
    ordersSheet_();
  } finally {
    lock.releaseLock();
  }
}

function appendOnce_(payload) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(COD.LOCK_WAIT_MS)) return { ok: false, error: "busy" };
  try {
    var sheet = ordersSheet_();
    var existing = findOrderRow_(sheet, payload.orderId);
    if (existing) {
      // Already recorded: acknowledge again, change nothing (staff columns
      // and any edits stay as they are).
      return { ok: true, orderId: payload.orderId, result: "duplicate", row: existing };
    }
    var row = sheet.getLastRow() + 1;
    var range = sheet.getRange(row, 1, 1, COD.WRITTEN_COLUMNS);
    // Plain-text format first, so leading zeros survive and nothing is parsed
    // as a number, date or formula.
    range.setNumberFormat("@");
    range.setValues([buildRow_(payload).map(literal_)]);
    SpreadsheetApp.flush();
    return { ok: true, orderId: payload.orderId, result: "created", row: row };
  } finally {
    lock.releaseLock();
  }
}

function ordersSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Not bound: create this script from the sheet (Extensions → Apps Script)");
  var name = PropertiesService.getScriptProperties().getProperty("ORDERS_TAB") || COD.DEFAULT_TAB;
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    var header = sheet.getRange(1, 1, 1, COD.COLUMNS.length);
    header.setNumberFormat("@");
    header.setValues([COD.COLUMNS]);
    header.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findOrderRow_(sheet, orderId) {
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var match = sheet
    .getRange(2, 1, last - 1, 1)
    .createTextFinder(orderId)
    .matchCase(true)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : null;
}

function buildRow_(p) {
  var items = p.items
    .map(function (i) {
      return i.quantity + " × " + i.name + " @ " + i.unitPrice;
    })
    .join("; ");
  var deliveryKnown = p.deliveryFee !== null;
  return [
    p.orderId,
    p.createdAt,
    p.mode === "test" ? "TEST" : "LIVE",
    p.orderStatus,
    p.paymentMethod === "cod" ? "Cash on delivery" : p.paymentMethod,
    p.paymentStatus,
    p.customer.name,
    p.customer.mobile,
    p.customer.email,
    p.address.street,
    p.address.barangay,
    p.address.city,
    p.address.province,
    p.address.postalCode,
    items,
    String(p.totalQuantity),
    p.currency,
    p.subtotal,
    // Never "Free": an unconfigured delivery charge is unknown.
    deliveryKnown ? p.deliveryFee : "Unknown (not configured)",
    deliveryKnown ? p.total : p.total + " + delivery (unknown)",
    p.address.notes,
  ];
}

/**
 * Text that starts like a formula is prefixed with an apostrophe, so it is
 * stored literally even if the cell format were changed later.
 */
function literal_(value) {
  var text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function validatePayload_(p) {
  var invalid = { ok: false, error: "invalid_request" };
  if (!p || typeof p !== "object") return invalid;
  if (COD.ACCEPTED_MODES.indexOf(p.mode) === -1) return { ok: false, error: "mode_not_allowed" };
  if (typeof p.orderId !== "string" || !TEST_ORDER_ID.test(p.orderId)) {
    return /^AD-L-/.test(String(p.orderId)) ? { ok: false, error: "mode_not_allowed" } : invalid;
  }
  if (!text_(p.createdAt, 40) || isNaN(Date.parse(p.createdAt))) return invalid;
  if (!text_(p.orderStatus, 40) || !text_(p.paymentStatus, 40)) return invalid;
  if (p.paymentMethod !== "cod" || p.currency !== "PHP") return invalid;

  var c = p.customer;
  if (!c || !text_(c.name, 100) || !text_(c.email, 254)) return invalid;
  if (typeof c.mobile !== "string" || !/^09\d{9}$/.test(c.mobile)) return invalid;

  var a = p.address;
  if (!a || !text_(a.street, 200) || !text_(a.barangay, 100) || !text_(a.city, 100) || !text_(a.province, 100)) {
    return invalid;
  }
  if (typeof a.postalCode !== "string" || !/^(\d{4})?$/.test(a.postalCode)) return invalid;
  if (typeof a.notes !== "string" || a.notes.length > 300) return invalid;

  if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 20) return invalid;
  var quantity = 0;
  var subtotal = 0;
  for (var n = 0; n < p.items.length; n++) {
    var item = p.items[n];
    if (!item || !text_(item.name, 120)) return invalid;
    if (typeof item.quantity !== "number" || item.quantity % 1 !== 0 || item.quantity < 1 || item.quantity > 10) {
      return invalid;
    }
    if (!MONEY.test(item.unitPrice) || !MONEY.test(item.lineTotal)) return invalid;
    if (cents_(item.unitPrice) * item.quantity !== cents_(item.lineTotal)) return invalid;
    quantity += item.quantity;
    subtotal += cents_(item.lineTotal);
  }
  if (p.totalQuantity !== quantity) return invalid;
  if (!MONEY.test(p.subtotal) || cents_(p.subtotal) !== subtotal) return invalid;
  if (p.deliveryFee !== null && !MONEY.test(p.deliveryFee)) return invalid;
  if (!MONEY.test(p.total) || cents_(p.total) !== subtotal + (p.deliveryFee === null ? 0 : cents_(p.deliveryFee))) {
    return invalid;
  }
  return { ok: true };
}

function text_(value, max) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function cents_(money) {
  var parts = money.split(".");
  return Number(parts[0]) * 100 + Number(parts[1]);
}

function hmacHex_(message, secret) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret, Utilities.Charset.UTF_8);
  var hex = "";
  for (var n = 0; n < bytes.length; n++) {
    var b = bytes[n] & 0xff;
    hex += (b < 16 ? "0" : "") + b.toString(16);
  }
  return hex;
}

/** Compares every character, so timing does not reveal where they differ. */
function constantTimeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var n = 0; n < a.length; n++) diff |= a.charCodeAt(n) ^ b.charCodeAt(n);
  return diff === 0;
}

function parseJson_(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function reply_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
