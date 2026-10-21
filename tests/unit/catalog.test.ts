import { describe, expect, it } from "vitest";
import { getRelatedProducts, getShopProduct, getShopProducts, toShopProduct } from "@/lib/catalog";
import { findClaims } from "@/lib/claims";
import { addMoney, multiplyMoney } from "@/lib/money";
import { PRODUCT_DETAILS } from "@/content/products";
import { site } from "@/content/site";

const HANDLES = [
  "hair-fall-defense-shampoo",
  "hair-fall-defense-conditioner",
  "hair-fall-defense-scalp-vitamin-serum",
  "scalp-balance-daily-shampoo",
];

describe("shop catalog adapter", () => {
  it("lists the four hair-care products, in marketing order, each with label details", () => {
    const products = getShopProducts();
    expect(products.map((p) => p.handle)).toEqual(HANDLES);
    expect(site.products.map((p) => p.slug)).toEqual(HANDLES);
    expect(PRODUCT_DETAILS.map((p) => p.handle).sort()).toEqual([...HANDLES].sort());
    for (const product of products) {
      expect(product.keyIngredients.length).toBeGreaterThan(0);
      expect(product.directions.length).toBeGreaterThan(0);
      expect(product.cautions).toContain("Keep out of reach of children.");
    }
  });

  it("has no prices or sizes until the owner confirms them, so nothing is purchasable", () => {
    for (const product of getShopProducts()) {
      expect(product.price).toEqual({ kind: "unavailable" });
      expect(product.cartProduct).toBeNull();
      expect(product.size).toBeNull();
    }
  });

  it("keeps the two shampoos' highlights distinct", () => {
    const names = (handle: string) => getShopProduct(handle)!.keyIngredients.map((i) => i.name);
    expect(names("scalp-balance-daily-shampoo")).toContain("Zinc PCA");
    expect(names("scalp-balance-daily-shampoo")).not.toContain("Redensyl®");
    expect(names("hair-fall-defense-shampoo")).toContain("Redensyl®");
    expect(names("hair-fall-defense-shampoo")).not.toContain("Zinc PCA");
  });

  it("carries the serum's adult-use and patch-test cautions", () => {
    const cautions = getShopProduct("hair-fall-defense-scalp-vitamin-serum")!.cautions.join(" ");
    expect(cautions).toMatch(/For adults/);
    expect(cautions).toMatch(/patch test.*24 hours/i);
  });

  it("publishes no formula percentages, supplier placeholders or certification marks", () => {
    for (const p of getShopProducts()) {
      const text = [
        p.name,
        p.summary,
        p.description,
        ...p.directions,
        ...p.cautions,
        ...p.keyIngredients.flatMap((i) => [i.name, i.benefit]),
      ].join("\n");
      expect(text).not.toMatch(/\d+(\.\d+)?\s?%/);
      expect(text).not.toMatch(/INCI per supplier|\[|_{3,}/);
      expect(text).not.toMatch(/COSMOS|Ecocert|certified/i);
      expect(text).not.toMatch(/concept/i);
    }
  });

  it("makes a product purchasable only with a confirmed price", () => {
    const entry = { ...site.products[0], priceMinor: 120000, currency: "PHP" as const };
    const product = toShopProduct(entry);
    expect(product.price).toEqual({ kind: "confirmed", priceMinor: 120000 });
    expect(product.cartProduct?.priceMinor).toBe(120000);
    expect(product.cartProduct?.handle).toBe(entry.slug);
  });

  it("never turns a zero price into a purchasable product", () => {
    const product = toShopProduct({ ...site.products[0], priceMinor: 0, currency: "PHP" });
    expect(product.price).toEqual({ kind: "unavailable" });
    expect(product.cartProduct).toBeNull();
  });

  it("uses no photography it does not have", () => {
    for (const product of getShopProducts()) {
      expect(product.images).toEqual([]);
    }
  });

  it("returns undefined for unknown and obsolete handles and excludes self from related", () => {
    expect(getShopProduct("does-not-exist")).toBeUndefined();
    expect(getShopProduct("radiance-barrier-serum")).toBeUndefined();
    const related = getRelatedProducts("hair-fall-defense-conditioner");
    expect(related.length).toBe(3);
    expect(related.some((p) => p.handle === "hair-fall-defense-conditioner")).toBe(false);
  });

  it("shop copy clears the claims guard", () => {
    for (const p of getShopProducts()) {
      const texts = [
        p.name,
        p.summary,
        p.description,
        ...p.directions,
        ...p.cautions,
        ...p.keyIngredients.flatMap((i) => [i.name, i.benefit]),
      ];
      for (const text of texts) {
        expect(findClaims(text)).toEqual([]);
      }
    }
  });

  it("cart totals for a confirmed-price product stay integer via money utilities", () => {
    const a = toShopProduct({ ...site.products[0], priceMinor: 49900, currency: "PHP" });
    const b = toShopProduct({ ...site.products[1], priceMinor: 54950, currency: "PHP" });
    const total = addMoney(
      multiplyMoney(a.cartProduct!.priceMinor, 2),
      multiplyMoney(b.cartProduct!.priceMinor, 3),
    );
    expect(Number.isInteger(total)).toBe(true);
    expect(total).toBe(49900 * 2 + 54950 * 3);
  });
});
