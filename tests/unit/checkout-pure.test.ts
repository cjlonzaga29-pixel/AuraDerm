import { describe, expect, it } from "vitest";
import { priceLines } from "@/lib/checkout/pricing";
import { normalizePhilippineMobile, validateCustomer } from "@/lib/checkout/customer";
import { countsTowardSold, soldUnits } from "@/lib/checkout/sold";
import { getShopProducts } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

const products = getShopProducts();
const SHAMPOO = "hair-fall-defense-shampoo";
const SERUM = "hair-fall-defense-scalp-vitamin-serum";

describe("server pricing", () => {
  it("prices from the catalog: ₱1,299 × 2 = ₱2,598, plus one more unit = ₱3,897", () => {
    const two = priceLines([{ handle: SHAMPOO, quantity: 2 }], products);
    expect(two.ok && two.order.subtotalMinor).toBe(259800);
    expect(two.ok && formatMoney(two.order.subtotalMinor)).toBe("₱2,598.00");

    const three = priceLines(
      [
        { handle: SHAMPOO, quantity: 2 },
        { handle: SERUM, quantity: 1 },
      ],
      products,
    );
    expect(three.ok && three.order.subtotalMinor).toBe(389700);
    expect(three.ok && formatMoney(three.order.subtotalMinor)).toBe("₱3,897.00");
    expect(three.ok && three.order.usesSamplePrices).toBe(true);
    expect(three.ok && three.order.lines.every((l) => l.unitPriceMinor === 129900 && l.currency === "PHP")).toBe(true);
  });

  it("rejects any client-supplied price field", () => {
    for (const key of ["priceMinor", "price", "unitPriceMinor", "amount", "total", "currency"]) {
      const result = priceLines([{ handle: SHAMPOO, quantity: 1, [key]: 1 }], products);
      expect(result).toEqual({ ok: false, error: { code: "client_price_rejected", index: 0 } });
    }
  });

  it("rejects invalid quantities", () => {
    for (const quantity of [0, -1, 1.5, 11, "2", null, Number.NaN, Infinity]) {
      const result = priceLines([{ handle: SHAMPOO, quantity }], products);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error.code).toBe("invalid_quantity");
    }
  });

  it("rejects unknown products, duplicates, empty and oversized orders", () => {
    expect(priceLines([{ handle: "radiance-barrier-serum", quantity: 1 }], products)).toMatchObject({
      ok: false,
      error: { code: "unknown_product" },
    });
    expect(
      priceLines(
        [
          { handle: SHAMPOO, quantity: 1 },
          { handle: SHAMPOO, quantity: 1 },
        ],
        products,
      ),
    ).toMatchObject({ ok: false, error: { code: "duplicate_line" } });
    expect(priceLines([], products)).toMatchObject({ ok: false, error: { code: "empty" } });
    expect(priceLines("nope", products)).toMatchObject({ ok: false, error: { code: "empty" } });
    expect(
      priceLines(
        Array.from({ length: 11 }, () => ({ handle: SHAMPOO, quantity: 1 })),
        products,
      ),
    ).toMatchObject({ ok: false, error: { code: "too_many_lines" } });
  });

  it("refuses products without a confirmed or sample price", () => {
    const unpriced = products.map((p) =>
      p.handle === SHAMPOO ? { ...p, price: { kind: "unavailable" as const }, cartProduct: null } : p,
    );
    expect(priceLines([{ handle: SHAMPOO, quantity: 1 }], unpriced)).toMatchObject({
      ok: false,
      error: { code: "not_purchasable" },
    });
  });
});

const VALID = {
  fullName: "Maria Santos",
  phone: "0917 123 4567",
  email: "Maria@Example.com",
  address: { line1: "12 Mabini St.", barangay: "San Isidro", city: "Quezon City", province: "Metro Manila", postalCode: "1100", notes: "" },
};

describe("customer validation", () => {
  it("normalizes Philippine mobile numbers", () => {
    expect(normalizePhilippineMobile("0917 123 4567")).toBe("+639171234567");
    expect(normalizePhilippineMobile("+63 917-123-4567")).toBe("+639171234567");
    expect(normalizePhilippineMobile("639171234567")).toBe("+639171234567");
    expect(normalizePhilippineMobile("02 8123 4567")).toBeNull();
    expect(normalizePhilippineMobile("0917123456")).toBeNull();
  });

  it("accepts a complete Philippine address and normalizes values", () => {
    const result = validateCustomer(VALID);
    expect(result.ok).toBe(true);
    expect(result.ok && result.customer.phone).toBe("+639171234567");
    expect(result.ok && result.customer.email).toBe("maria@example.com");
  });

  it("reports each missing or invalid field", () => {
    const result = validateCustomer({ ...VALID, phone: "12345", email: "nope", address: { ...VALID.address, barangay: "", postalCode: "11" } });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["barangay", "email", "phone", "postalCode"]);
    expect(validateCustomer(null).ok).toBe(false);
  });

  it("strips control characters and angle brackets, and caps lengths", () => {
    const result = validateCustomer({ ...VALID, fullName: "Maria\u0000 <b>Santos</b>" });
    expect(result.ok && result.customer.fullName).toBe("Maria b Santos /b");
    expect(validateCustomer({ ...VALID, fullName: "x".repeat(101) }).ok).toBe(false);
  });
});

describe("sold-count semantics", () => {
  const base = { mode: "live" as const, paymentMethod: "online" as const, paymentStatus: "paid", fulfillmentStatus: "unfulfilled" };

  it("never counts test orders, even when paid or delivered", () => {
    expect(countsTowardSold({ ...base, mode: "test" })).toBe(false);
    expect(countsTowardSold({ ...base, mode: "test", paymentMethod: "cod", paymentStatus: "cod_collected", fulfillmentStatus: "delivered" })).toBe(false);
  });

  it("counts paid online orders and delivered/collected COD orders only", () => {
    expect(countsTowardSold(base)).toBe(true);
    expect(countsTowardSold({ ...base, paymentStatus: "awaiting_payment" })).toBe(false);
    expect(countsTowardSold({ ...base, paymentMethod: "cod", paymentStatus: "cod_pending", fulfillmentStatus: "awaiting_confirmation" })).toBe(false);
    expect(countsTowardSold({ ...base, paymentMethod: "cod", paymentStatus: "cod_pending", fulfillmentStatus: "delivered" })).toBe(true);
  });

  it("excludes cancelled, refunded and returned orders", () => {
    expect(countsTowardSold({ ...base, paymentStatus: "refunded" })).toBe(false);
    expect(countsTowardSold({ ...base, fulfillmentStatus: "returned" })).toBe(false);
    expect(countsTowardSold({ ...base, paymentMethod: "cod", paymentStatus: "cancelled", fulfillmentStatus: "delivered" })).toBe(false);
  });

  it("sums units per product across qualifying orders", () => {
    const totals = soldUnits([
      { ...base, items: [{ handle: SHAMPOO, quantity: 2 }] },
      { ...base, mode: "test", items: [{ handle: SHAMPOO, quantity: 5 }] },
      { ...base, items: [{ handle: SHAMPOO, quantity: 1 }, { handle: SERUM, quantity: 1 }] },
    ]);
    expect(Object.fromEntries(totals)).toEqual({ [SHAMPOO]: 3, [SERUM]: 1 });
  });
});
