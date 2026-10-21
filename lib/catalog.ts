import { site } from "@/content/site";
import { getProductDetails, type KeyIngredient } from "@/content/products";
import type { Product } from "@/types/store";

export type ConceptVisual = "cleanse" | "prepare" | "hydrate" | "finish";

export type ProductCategory = "Shampoo" | "Conditioner" | "Scalp serum";

export type PriceState =
  | { kind: "confirmed"; priceMinor: number }
  | { kind: "unavailable" };

export type ShopProduct = {
  handle: string;
  name: string;
  /** Name without the brand prefix, for headings shown beside the brand label. */
  displayName: string;
  category: ProductCategory;
  /** Net content; null while unconfirmed. */
  size: string | null;
  summary: string;
  description: string;
  keyIngredients: KeyIngredient[];
  directions: string[];
  cautions: string[];
  images: { src: string; alt: string }[];
  /** Placeholder artwork used until product photography exists. */
  concept: ConceptVisual;
  price: PriceState;
  /** Store record handed to the cart; null when the product cannot be bought. */
  cartProduct: Product | null;
};

const CONCEPTS: Record<string, ConceptVisual> = {
  "hair-fall-defense-shampoo": "cleanse",
  "hair-fall-defense-conditioner": "hydrate",
  "hair-fall-defense-scalp-vitamin-serum": "finish",
  "scalp-balance-daily-shampoo": "prepare",
};

const CATEGORIES: Record<string, ProductCategory> = {
  "hair-fall-defense-shampoo": "Shampoo",
  "hair-fall-defense-conditioner": "Conditioner",
  "hair-fall-defense-scalp-vitamin-serum": "Scalp serum",
  "scalp-balance-daily-shampoo": "Shampoo",
};

export const BRAND_LABEL = "Aura Derm";

// Bridges the two content sources: content/site.ts is the marketing source of
// truth (order, names, sizes, prices — all null today) and content/products.ts
// holds the label-guide copy. Only a confirmed price makes a product
// purchasable; a missing price stays missing rather than becoming zero.
export function toShopProduct(entry: (typeof site.products)[number]): ShopProduct {
  const details = getProductDetails(entry.slug);

  const price: PriceState =
    entry.priceMinor !== null && Number.isInteger(entry.priceMinor) && entry.priceMinor > 0
      ? { kind: "confirmed", priceMinor: entry.priceMinor }
      : { kind: "unavailable" };

  const images: ShopProduct["images"] = entry.image
    ? [{ src: entry.image.src, alt: entry.image.alt }]
    : [];

  return {
    handle: entry.slug,
    name: entry.name,
    displayName: entry.name.replace(/^Aura Derm\s+/, ""),
    category: CATEGORIES[entry.slug] ?? "Shampoo",
    size: entry.size,
    summary: details?.subtitle ?? entry.shortDescription,
    description: details?.description ?? entry.shortDescription,
    keyIngredients: details?.keyIngredients ?? [],
    directions: details?.directions ?? [],
    cautions: details?.cautions ?? [],
    images,
    concept: CONCEPTS[entry.slug] ?? "hydrate",
    price,
    cartProduct:
      details && price.kind === "confirmed"
        ? {
            id: `prod_${entry.slug}`,
            handle: entry.slug,
            title: entry.name,
            subtitle: details.subtitle,
            description: details.description,
            priceMinor: price.priceMinor,
            volume: entry.size ?? "",
            images,
            inStock: true,
            ingredients: details.keyIngredients.map((i) => i.name),
            usage: details.directions.join(" "),
          }
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
