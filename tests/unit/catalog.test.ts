import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getRelatedProducts, getShopProduct, getShopProducts, toShopProduct } from "@/lib/catalog";
import { findClaims } from "@/lib/claims";
import { addMoney, multiplyMoney } from "@/lib/money";
import { PRODUCT_DETAILS } from "@/content/products";
import { site } from "@/content/site";

// Display order for the homepage collection and /shop: the serum comes last.
const HANDLES = [
  "hair-fall-defense-shampoo",
  "hair-fall-defense-conditioner",
  "scalp-balance-daily-shampoo",
  "hair-fall-defense-scalp-vitamin-serum",
];

const SAMPLE_PRICE_MINOR = 129900;

describe("shop catalog adapter", () => {
  it("lists the four hair-care products, in display order, each with label details", () => {
    const products = getShopProducts();
    expect(products.map((p) => p.handle)).toEqual(HANDLES);
    expect(site.productOrder).toEqual(HANDLES);
    expect(site.products.map((p) => p.slug).sort()).toEqual([...HANDLES].sort());
    expect(PRODUCT_DETAILS.map((p) => p.handle).sort()).toEqual([...HANDLES].sort());
    for (const product of products) {
      expect(product.keyIngredients.length).toBeGreaterThan(0);
      expect(product.directions.length).toBeGreaterThan(0);
      expect(product.cautions).toContain("Keep out of reach of children.");
    }
  });

  it("orders by slug, not by position in site.products", () => {
    const original = site.products;
    try {
      site.products = [...original].reverse();
      expect(getShopProducts().map((p) => p.handle)).toEqual(HANDLES);
    } finally {
      site.products = original;
    }
  });

  it("keeps retail prices and sizes unconfirmed; each product carries the PHP 1,299 sample price", () => {
    for (const entry of site.products) {
      expect(entry.priceMinor).toBeNull();
      expect(entry.currency).toBeNull();
      expect(entry.samplePrice).toEqual({ priceMinor: SAMPLE_PRICE_MINOR, currency: "PHP" });
    }
    for (const product of getShopProducts()) {
      expect(product.price).toEqual({ kind: "sample", priceMinor: SAMPLE_PRICE_MINOR });
      expect(product.cartProduct?.priceMinor).toBe(SAMPLE_PRICE_MINOR);
      expect(product.cartProduct?.priceKind).toBe("sample");
      expect(product.size).toBeNull();
    }
  });

  it("keeps a product unpurchasable with neither a confirmed nor a sample price", () => {
    const product = toShopProduct({ ...site.products[0], samplePrice: null });
    expect(product.price).toEqual({ kind: "unavailable" });
    expect(product.cartProduct).toBeNull();
  });

  it("never turns a zero sample price into a purchasable product", () => {
    const product = toShopProduct({
      ...site.products[0],
      samplePrice: { priceMinor: 0, currency: "PHP" },
    });
    expect(product.price).toEqual({ kind: "unavailable" });
    expect(product.cartProduct).toBeNull();
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

  it("prefers a confirmed retail price over the sample price", () => {
    const entry = { ...site.products[0], priceMinor: 120000, currency: "PHP" as const };
    const product = toShopProduct(entry);
    expect(product.price).toEqual({ kind: "confirmed", priceMinor: 120000 });
    expect(product.cartProduct?.priceMinor).toBe(120000);
    expect(product.cartProduct?.priceKind).toBe("confirmed");
    expect(product.cartProduct?.handle).toBe(entry.slug);
  });

  it("never turns a zero price into a purchasable product", () => {
    const product = toShopProduct({
      ...site.products[0],
      priceMinor: 0,
      currency: "PHP",
      samplePrice: null,
    });
    expect(product.price).toEqual({ kind: "unavailable" });
    expect(product.cartProduct).toBeNull();
  });

  it("derives brand-free display names and categories, keeping full names", () => {
    const serum = getShopProduct("hair-fall-defense-scalp-vitamin-serum")!;
    expect(serum.name).toBe("Aura Derm Hair Fall Defense Scalp Vitamin Serum");
    expect(serum.displayName).toBe("Hair Fall Defense Scalp Vitamin Serum");
    expect(serum.category).toBe("Scalp serum");
    expect(getShopProducts().map((p) => p.category)).toEqual([
      "Shampoo",
      "Conditioner",
      "Shampoo",
      "Scalp serum",
    ]);
  });

  it("shows each product's own images, every one labelled as illustrative packaging", () => {
    for (const product of getShopProducts()) {
      for (const image of product.images) {
        expect(existsSync(path.join(process.cwd(), "public", image.src))).toBe(true);
        expect(image.illustrative).toBe(true);
        expect(image.alt).toMatch(/^Illustrative packaging: /);
        expect(findClaims(image.alt)).toEqual([]);
      }
      if (
        ["hair-fall-defense-scalp-vitamin-serum", "hair-fall-defense-shampoo", "scalp-balance-daily-shampoo"].includes(
          product.handle,
        )
      )
        continue;
      expect(product.images).toHaveLength(1);
      const [front] = product.images;
      expect(front.src).toBe(`/images/products/${product.handle}-front.webp`);
      expect([front.width, front.height]).toEqual([1122, 1402]);
    }
  });

  it("gives the serum the eight Follivance images in order, image 1 first everywhere", () => {
    const serum = getShopProduct("hair-fall-defense-scalp-vitamin-serum")!;
    const srcs = Array.from({ length: 8 }, (_, i) => `/images/products/follivance-hair-density-serum-0${i + 1}.webp`);
    expect(serum.images.map((image) => image.src)).toEqual(srcs);
    expect(serum.images.map((image) => image.view)).toEqual(["front", ...Array(7).fill("styled")]);
    for (const image of serum.images) expect([image.width, image.height]).toEqual([1254, 1254]);
    // Cards and the related row read images[0]; the bag reads cartProduct.
    expect(serum.cartProduct!.images[0].src).toBe(srcs[0]);
    expect(getRelatedProducts("hair-fall-defense-shampoo").find((p) => p.handle === serum.handle)!.images[0].src).toBe(
      srcs[0],
    );
    // The name is unchanged.
    expect(serum.name).toBe("Aura Derm Hair Fall Defense Scalp Vitamin Serum");
  });

  it("gives the Hair Fall Defense Shampoo its eight images in order, image 1 first everywhere", () => {
    const shampoo = getShopProduct("hair-fall-defense-shampoo")!;
    const srcs = Array.from({ length: 8 }, (_, i) => `/images/products/hair-fall-defense-shampoo-0${i + 1}.webp`);
    expect(shampoo.images.map((image) => image.src)).toEqual(srcs);
    expect(shampoo.images.map((image) => image.view)).toEqual(["front", ...Array(7).fill("styled")]);
    for (const image of shampoo.images) expect([image.width, image.height]).toEqual([1254, 1254]);
    expect(shampoo.cartProduct!.images[0].src).toBe(srcs[0]);
    expect(getRelatedProducts("hair-fall-defense-conditioner").find((p) => p.handle === shampoo.handle)!.images[0].src).toBe(
      srcs[0],
    );
    expect(shampoo.name).toBe("Aura Derm Hair Fall Defense Shampoo");
    expect(shampoo.size).toBeNull();
  });

  it("gives the Scalp Balance Daily Shampoo its eight images in order, image 1 first everywhere", () => {
    const shampoo = getShopProduct("scalp-balance-daily-shampoo")!;
    const srcs = Array.from({ length: 8 }, (_, i) => `/images/products/scalp-balance-daily-shampoo-0${i + 1}.webp`);
    expect(shampoo.images.map((image) => image.src)).toEqual(srcs);
    expect(shampoo.images.map((image) => image.view)).toEqual(["front", ...Array(7).fill("styled")]);
    for (const image of shampoo.images) expect([image.width, image.height]).toEqual([1254, 1254]);
    expect(shampoo.cartProduct!.images[0].src).toBe(srcs[0]);
    expect(getRelatedProducts("hair-fall-defense-shampoo").find((p) => p.handle === shampoo.handle)!.images[0].src).toBe(
      srcs[0],
    );
    // Artwork label text (250 mL, Piroctone Olamine) is not catalog fact.
    expect(shampoo.name).toBe("Aura Derm Scalp Balance Daily Shampoo");
    expect(shampoo.size).toBeNull();
    expect(JSON.stringify(shampoo)).not.toMatch(/Piroctone/i);
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

  it("sample-price totals stay integer: 2 × ₱1,299 then one more product", () => {
    const [a, b] = getShopProducts();
    const two = multiplyMoney(a.cartProduct!.priceMinor, 2);
    expect(two).toBe(259800);
    expect(addMoney(two, multiplyMoney(b.cartProduct!.priceMinor, 1))).toBe(389700);
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
