import { describe, expect, it } from "vitest";
import { getRelatedProducts, getShopProduct, getShopProducts, toShopProduct } from "@/lib/catalog";
import { findClaims } from "@/lib/claims";
import { addMoney, multiplyMoney } from "@/lib/money";
import { site } from "@/content/site";

describe("shop catalog adapter", () => {
  it("lists every marketing product, in marketing order, with a store record", () => {
    const products = getShopProducts();
    expect(products.map((p) => p.handle)).toEqual(site.products.map((p) => p.slug));
    for (const product of products) {
      expect(product.cartProduct?.handle).toBe(product.handle);
    }
  });

  it("surfaces demo prices only as illustrative integer amounts, never zero", () => {
    for (const product of getShopProducts()) {
      expect(product.price.kind).toBe("illustrative");
      if (product.price.kind !== "unavailable") {
        expect(Number.isInteger(product.price.priceMinor)).toBe(true);
        expect(product.price.priceMinor).toBeGreaterThan(0);
        expect(product.cartProduct?.priceMinor).toBe(product.price.priceMinor);
      }
    }
  });

  it("prefers a confirmed marketing price over the demo price", () => {
    const entry = { ...site.products[0], priceMinor: 120000, currency: "PHP" as const };
    const product = toShopProduct(entry);
    expect(product.price).toEqual({ kind: "confirmed", priceMinor: 120000 });
    expect(product.cartProduct?.priceMinor).toBe(120000);
  });

  it("leaves a product without any price unavailable and not purchasable", () => {
    const product = toShopProduct({ ...site.products[0], slug: "unlisted-concept" });
    expect(product.price).toEqual({ kind: "unavailable" });
    expect(product.cartProduct).toBeNull();
  });

  it("uses no photography it does not have", () => {
    for (const product of getShopProducts()) {
      expect(product.images).toEqual([]);
    }
  });

  it("returns undefined for unknown handles and excludes self from related", () => {
    expect(getShopProduct("does-not-exist")).toBeUndefined();
    const related = getRelatedProducts("radiance-barrier-serum");
    expect(related.length).toBe(2);
    expect(related.some((p) => p.handle === "radiance-barrier-serum")).toBe(false);
  });

  it("shop copy clears the claims guard", () => {
    for (const p of getShopProducts()) {
      for (const text of [p.name, p.summary, p.description, p.usage ?? "", ...p.ingredients]) {
        expect(findClaims(text)).toEqual([]);
      }
    }
  });

  it("cart totals for shop products stay integer via money utilities", () => {
    const [a, b] = getShopProducts();
    const total = addMoney(
      multiplyMoney(a.cartProduct!.priceMinor, 2),
      multiplyMoney(b.cartProduct!.priceMinor, 3),
    );
    expect(Number.isInteger(total)).toBe(true);
    expect(total).toBe(a.cartProduct!.priceMinor * 2 + b.cartProduct!.priceMinor * 3);
  });
});
