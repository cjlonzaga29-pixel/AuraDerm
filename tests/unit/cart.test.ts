import { describe, expect, it } from "vitest";
import { reconcileCartItems } from "@/lib/cart";
import { getShopProducts, toShopProduct } from "@/lib/catalog";
import { addMoney, multiplyMoney } from "@/lib/money";
import { site } from "@/content/site";
import type { CartItem } from "@/types/store";

const stored = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: "prod_hair-fall-defense-shampoo",
  handle: "hair-fall-defense-shampoo",
  title: "Old title",
  priceMinor: 100,
  quantity: 2,
  volume: "",
  image: "",
  ...overrides,
});

const subtotal = (items: CartItem[]) =>
  addMoney(...items.map((i) => multiplyMoney(i.priceMinor, i.quantity)));

describe("stored cart reconciliation", () => {
  it("reprices a stale entry from the current catalog, keeping its quantity", () => {
    const [item] = reconcileCartItems([stored()], getShopProducts());
    expect(item).toMatchObject({
      productId: "prod_hair-fall-defense-shampoo",
      title: "Aura Derm Hair Fall Defense Shampoo",
      priceMinor: 129900,
      priceKind: "sample",
      quantity: 2,
      image: "/images/products/hair-fall-defense-shampoo-01.webp",
    });
    expect(subtotal([item])).toBe(259800);
  });

  it("totals two sample-priced products from catalog prices", () => {
    const items = reconcileCartItems(
      [
        stored(),
        stored({
          productId: "prod_hair-fall-defense-scalp-vitamin-serum",
          handle: "hair-fall-defense-scalp-vitamin-serum",
          priceMinor: 999999,
          quantity: 1,
        }),
      ],
      getShopProducts(),
    );
    expect(items).toHaveLength(2);
    expect(subtotal(items)).toBe(389700);
  });

  it("drops entries the catalog cannot sell, unknown ids and mismatched handles", () => {
    const unpriced = site.products.map((entry) => toShopProduct({ ...entry, samplePrice: null }));
    expect(reconcileCartItems([stored()], unpriced)).toEqual([]);
    expect(
      reconcileCartItems(
        [
          stored({ productId: "prod_radiance_barrier_serum", handle: "radiance-barrier-serum" }),
          stored({ handle: "scalp-balance-daily-shampoo" }),
        ],
        getShopProducts(),
      ),
    ).toEqual([]);
  });

  it("drops malformed entries and duplicate ids; non-arrays become an empty cart", () => {
    const items = reconcileCartItems(
      [
        null,
        "x",
        stored({ quantity: 0 }),
        stored({ quantity: 1.5 }),
        stored({ quantity: 1 }),
        stored({ quantity: 4 }),
      ],
      getShopProducts(),
    );
    expect(items.map((i) => i.quantity)).toEqual([1]);
    expect(reconcileCartItems({ items: [] }, getShopProducts())).toEqual([]);
    expect(reconcileCartItems(null, getShopProducts())).toEqual([]);
  });
});
