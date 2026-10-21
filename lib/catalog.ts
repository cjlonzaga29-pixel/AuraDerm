import { site } from "@/content/site";
import { PRODUCTS } from "@/content/products";
import type { Product } from "@/types/store";

export type ConceptVisual = "cleanse" | "hydrate" | "finish";

export type PriceState =
  | { kind: "confirmed"; priceMinor: number }
  | { kind: "illustrative"; priceMinor: number }
  | { kind: "unavailable" };

export type ShopProduct = {
  handle: string;
  name: string;
  size: string;
  summary: string;
  description: string;
  ingredients: string[];
  usage: string | null;
  images: { src: string; alt: string }[];
  concept: ConceptVisual;
  price: PriceState;
  /** Store record handed to the cart; null when the product cannot be bought. */
  cartProduct: Product | null;
};

const CONCEPTS: Record<string, ConceptVisual> = {
  "botanical-cleansing-elixir": "cleanse",
  "radiance-barrier-serum": "hydrate",
  "night-renewal-nectar": "finish",
};

// Bridges the two catalogs: content/site.ts is the marketing source of truth
// (order, names, sizes, confirmed prices — all null today), content/products.ts
// is the demo store record (copy, ingredients and placeholder prices). A
// confirmed marketing price wins; otherwise a demo price is surfaced only as
// illustrative, and a missing price stays missing rather than becoming zero.
export function toShopProduct(entry: (typeof site.products)[number]): ShopProduct {
  const store = PRODUCTS.find((p) => p.handle === entry.slug);

  let price: PriceState = { kind: "unavailable" };
  if (entry.priceMinor !== null && Number.isInteger(entry.priceMinor)) {
    price = { kind: "confirmed", priceMinor: entry.priceMinor };
  } else if (store && Number.isInteger(store.priceMinor) && store.priceMinor > 0) {
    price = { kind: "illustrative", priceMinor: store.priceMinor };
  }

  return {
    handle: entry.slug,
    name: entry.name,
    size: entry.size,
    summary: store?.subtitle ?? entry.shortDescription,
    description: store?.description ?? entry.shortDescription,
    ingredients: store?.ingredients ?? [],
    usage: store?.usage ?? null,
    images: store?.images ?? [],
    concept: CONCEPTS[entry.slug] ?? "hydrate",
    price,
    cartProduct:
      store && price.kind !== "unavailable"
        ? { ...store, title: entry.name, volume: entry.size, priceMinor: price.priceMinor }
        : null,
  };
}

export function getShopProducts(): ShopProduct[] {
  return site.products.map(toShopProduct);
}

export function getShopProduct(handle: string): ShopProduct | undefined {
  return getShopProducts().find((p) => p.handle === handle);
}

export function getRelatedProducts(handle: string, limit = 3): ShopProduct[] {
  return getShopProducts()
    .filter((p) => p.handle !== handle)
    .slice(0, limit);
}
