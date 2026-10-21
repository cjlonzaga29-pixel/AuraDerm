import { site } from "@/content/site";
import { getProductDetails, type KeyIngredient } from "@/content/products";
import type { Product } from "@/types/store";

export type CatalogImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Generated packaging mockup rather than product photography. */
  illustrative?: boolean;
};

export type ConceptVisual = "cleanse" | "prepare" | "hydrate" | "finish";

export type ProductCategory = "Shampoo" | "Conditioner" | "Scalp serum";

export type PriceState =
  | { kind: "confirmed"; priceMinor: number }
  /** Owner-authorized testing price, always shown labelled "Sample price". */
  | { kind: "sample"; priceMinor: number }
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
  /** Front view first; further views (back, front/back) follow in gallery order. */
  images: CatalogImage[];
  /** Placeholder artwork used for products without an image. */
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

const isPositiveMinor = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

// Bridges the two content sources: content/site.ts is the marketing source of
// truth (order, names, sizes, retail prices — all null today — and sample
// prices) and content/products.ts holds the label-guide copy. A confirmed
// retail price wins; otherwise a valid PHP sample price makes the product
// testable in the bag. A missing price stays missing rather than becoming zero.
export function toShopProduct(entry: (typeof site.products)[number]): ShopProduct {
  const details = getProductDetails(entry.slug);

  const price: PriceState = isPositiveMinor(entry.priceMinor)
    ? { kind: "confirmed", priceMinor: entry.priceMinor }
    : entry.samplePrice?.currency === "PHP" && isPositiveMinor(entry.samplePrice.priceMinor)
      ? { kind: "sample", priceMinor: entry.samplePrice.priceMinor }
      : { kind: "unavailable" };

  const images: ShopProduct["images"] = entry.image
    ? [
        {
          src: entry.image.src,
          alt: entry.image.alt,
          width: entry.image.width,
          height: entry.image.height,
          illustrative: entry.image.illustrative,
        },
      ]
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
      details && price.kind !== "unavailable"
        ? {
            id: `prod_${entry.slug}`,
            handle: entry.slug,
            title: entry.name,
            subtitle: details.subtitle,
            description: details.description,
            priceMinor: price.priceMinor,
            priceKind: price.kind,
            volume: entry.size ?? "",
            images: images.map(({ src, alt }) => ({ src, alt })),
            inStock: true,
            ingredients: details.keyIngredients.map((i) => i.name),
            usage: details.directions.join(" "),
          }
        : null,
  };
}

// Sorted by slug against site.productOrder, so the display order never
// depends on where an entry sits in site.products; unlisted slugs go last.
export function getShopProducts(): ShopProduct[] {
  const rank = (slug: string) => {
    const index = site.productOrder.indexOf(slug);
    return index === -1 ? site.productOrder.length : index;
  };
  return [...site.products]
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map(toShopProduct);
}

export function getShopProduct(handle: string): ShopProduct | undefined {
  return getShopProducts().find((p) => p.handle === handle);
}

export function getRelatedProducts(handle: string, limit = 3): ShopProduct[] {
  return getShopProducts()
    .filter((p) => p.handle !== handle)
    .slice(0, limit);
}
