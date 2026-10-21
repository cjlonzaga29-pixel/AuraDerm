import type { ShopProduct } from "@/lib/catalog";
import type { CartItem } from "@/types/store";

// A stored cart is untrusted: it may predate a price change (or the sample
// price), name a product that is gone, or not be a cart at all. Each entry is
// matched to the current catalog by product id and handle; the catalog's
// price, label and image replace whatever was saved, and anything that is no
// longer purchasable, or whose quantity is not a positive integer, is dropped.
// Totals are therefore always computed from current catalog prices.
export function reconcileCartItems(stored: unknown, products: ShopProduct[]): CartItem[] {
  if (!Array.isArray(stored)) return [];

  const purchasable = new Map(
    products.flatMap((p) => (p.cartProduct ? [[p.cartProduct.id, p.cartProduct] as const] : [])),
  );
  const seen = new Set<string>();
  const items: CartItem[] = [];

  for (const entry of stored) {
    if (typeof entry !== "object" || entry === null) continue;
    const { productId, handle, quantity } = entry as Partial<CartItem>;
    if (typeof productId !== "string" || seen.has(productId)) continue;
    const product = purchasable.get(productId);
    if (!product || product.handle !== handle) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) continue;

    seen.add(productId);
    items.push({
      productId,
      handle: product.handle,
      title: product.title,
      priceMinor: product.priceMinor,
      priceKind: product.priceKind,
      quantity,
      volume: product.volume,
      image: product.images[0]?.src ?? "",
    });
  }

  return items;
}
