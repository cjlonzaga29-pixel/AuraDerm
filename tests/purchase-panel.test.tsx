import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { CartProvider } from "@/context/CartContext";
import { getShopProduct, toShopProduct } from "@/lib/catalog";
import { site } from "@/content/site";
import type { ShopProduct } from "@/lib/catalog";

const render = (product: ShopProduct) =>
  renderToStaticMarkup(
    <CartProvider>
      <PurchasePanel name={product.name} price={product.price} cartProduct={product.cartProduct} />
    </CartProvider>,
  );

describe("PurchasePanel", () => {
  it("offers quantity and Add to bag for a sample price, labelled with the checkout note", () => {
    const html = render(getShopProduct("hair-fall-defense-scalp-vitamin-serum")!);
    expect(html).toContain("₱1,299.00");
    expect(html).toContain("Sample price");
    expect(html).toContain("Sample pricing for testing. Checkout is unavailable.");
    expect(html).toContain("Add to bag");
    expect(html).toContain('aria-label="Quantity"');
    expect(html).not.toContain("Price coming soon");
    expect(html).not.toMatch(/checkout<\/button>|place order|pay now/i);
  });

  it("keeps the unpriced fallback with no buy controls", () => {
    const html = render(toShopProduct({ ...site.products[0], samplePrice: null }));
    expect(html).toContain("Price coming soon");
    expect(html).toContain("Purchasing will be available once pricing is confirmed.");
    expect(html).not.toContain("Add to bag");
    expect(html).not.toContain('aria-label="Quantity"');
    expect(html).not.toContain("Sample price");
  });
});
