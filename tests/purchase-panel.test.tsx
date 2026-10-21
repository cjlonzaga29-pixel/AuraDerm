import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { CartProvider } from "@/context/CartContext";
import { getShopProduct, toShopProduct } from "@/lib/catalog";
import { site } from "@/content/site";
import type { ShopProduct } from "@/lib/catalog";

// Static rendering has no App Router mounted.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const render = (product: ShopProduct) =>
  renderToStaticMarkup(
    <CartProvider>
      <PurchasePanel name={product.name} price={product.price} cartProduct={product.cartProduct} />
    </CartProvider>,
  );

describe("PurchasePanel", () => {
  it("offers quantity, Add to bag and Buy now for a sample price, shown without a preview label", () => {
    const html = render(getShopProduct("hair-fall-defense-scalp-vitamin-serum")!);
    expect(html).toContain("₱1,299.00");
    expect(html).not.toContain("Sample price");
    expect(html).toContain("Add to bag");
    expect(html).toContain("Buy now");
    expect(html).toContain('aria-label="Quantity"');
    expect(html).not.toContain("Price coming soon");
    expect(html).not.toMatch(/place order|pay now/i);
    // The sticky bar only appears once the main controls scroll away.
    expect(html).not.toContain("sticky-purchase-bar");
  });

  it("keeps the unpriced fallback with no buy controls", () => {
    const html = render(toShopProduct({ ...site.products[0], samplePrice: null }));
    expect(html).toContain("Price coming soon");
    expect(html).toContain("Purchasing will be available once pricing is confirmed.");
    expect(html).not.toContain("Add to bag");
    expect(html).not.toContain("Buy now");
    expect(html).not.toContain('aria-label="Quantity"');
    expect(html).not.toContain("Sample price");
  });
});
