import { addMoney, multiplyMoney } from "@/lib/money";
import type { ShopProduct } from "@/lib/catalog";
import { CHECKOUT_CURRENCY, MAX_LINE_QUANTITY, MAX_ORDER_LINES } from "@/lib/checkout/limits";

export type CheckoutLineInput = { handle: string; quantity: number };

export type PricedLine = {
  handle: string;
  name: string;
  priceKind: "confirmed" | "sample";
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  currency: typeof CHECKOUT_CURRENCY;
};

export type PricedOrder = {
  lines: PricedLine[];
  subtotalMinor: number;
  currency: typeof CHECKOUT_CURRENCY;
  usesSamplePrices: boolean;
};

export type PricingError =
  | { code: "empty" }
  | { code: "too_many_lines" }
  | { code: "malformed_line"; index: number }
  | { code: "client_price_rejected"; index: number }
  | { code: "unknown_product"; handle: string }
  | { code: "not_purchasable"; handle: string }
  | { code: "invalid_quantity"; handle: string }
  | { code: "duplicate_line"; handle: string };

const PRICE_KEYS = ["price", "priceMinor", "unitPriceMinor", "amount", "total", "lineTotalMinor", "currency"];

// Prices every line from the server's catalog. The client may only name a
// product handle and a quantity: any price-like field is treated as tampering
// and rejected rather than ignored, unknown handles and unpurchasable products
// are refused, and quantities must be whole numbers within the per-line cap.
export function priceLines(
  input: unknown,
  products: ShopProduct[],
): { ok: true; order: PricedOrder } | { ok: false; error: PricingError } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: { code: "empty" } };
  if (input.length > MAX_ORDER_LINES) return { ok: false, error: { code: "too_many_lines" } };

  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const seen = new Set<string>();
  const lines: PricedLine[] = [];

  for (const [index, raw] of input.entries()) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return { ok: false, error: { code: "malformed_line", index } };
    }
    const record = raw as Record<string, unknown>;
    if (PRICE_KEYS.some((key) => key in record)) {
      return { ok: false, error: { code: "client_price_rejected", index } };
    }
    const { handle, quantity } = record;
    if (typeof handle !== "string" || handle.length > 100) {
      return { ok: false, error: { code: "malformed_line", index } };
    }
    const product = byHandle.get(handle);
    if (!product) return { ok: false, error: { code: "unknown_product", handle } };
    if (seen.has(handle)) return { ok: false, error: { code: "duplicate_line", handle } };
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_LINE_QUANTITY
    ) {
      return { ok: false, error: { code: "invalid_quantity", handle } };
    }
    const cart = product.cartProduct;
    if (!cart || product.price.kind === "unavailable") {
      return { ok: false, error: { code: "not_purchasable", handle } };
    }
    seen.add(handle);
    lines.push({
      handle,
      name: product.name,
      priceKind: product.price.kind,
      unitPriceMinor: product.price.priceMinor,
      quantity,
      lineTotalMinor: multiplyMoney(product.price.priceMinor, quantity),
      currency: CHECKOUT_CURRENCY,
    });
  }

  return {
    ok: true,
    order: {
      lines,
      subtotalMinor: addMoney(...lines.map((l) => l.lineTotalMinor)),
      currency: CHECKOUT_CURRENCY,
      usesSamplePrices: lines.some((l) => l.priceKind === "sample"),
    },
  };
}

export function describePricingError(error: PricingError): string {
  switch (error.code) {
    case "empty":
      return "Your order has no items.";
    case "too_many_lines":
      return "Your order has too many different items.";
    case "malformed_line":
      return "An item in your order could not be read.";
    case "client_price_rejected":
      return "Prices are set by the store and cannot be submitted with an order.";
    case "unknown_product":
      return "An item in your order is not in the catalog.";
    case "not_purchasable":
      return "An item in your order is not available to buy.";
    case "invalid_quantity":
      return `Each item's quantity must be a whole number from 1 to ${MAX_LINE_QUANTITY}.`;
    case "duplicate_line":
      return "An item appears more than once in your order.";
  }
}
