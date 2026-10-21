"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/shop/PriceTag";
import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/money";
import { MAX_LINE_QUANTITY } from "@/lib/checkout/limits";
import type { PriceState } from "@/lib/catalog";
import type { Product } from "@/types/store";

export const SAMPLE_PRICE_NOTE =
  "Sample price for testing only. Real orders and payments are not enabled.";

// Quantity, Add to bag and Buy now, wired to the shared CartContext/CartSheet.
// Products without a usable price arrive with a null cartProduct: no controls
// render, only a single availability note, and addItem is never reachable.
// Buy now takes only this product and quantity to checkout and leaves the bag
// untouched. Below lg a sticky bar repeats Add to bag only once these
// controls have scrolled out of view above. `children` (e.g. highlights)
// sit between the price and the controls.
export function PurchasePanel({
  name,
  price,
  cartProduct,
  children,
}: {
  name: string;
  price: PriceState;
  cartProduct: Product | null;
  children?: ReactNode;
}) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const node = controlsRef.current;
    if (!node) return;
    // Hidden until the controls have scrolled up past the 64px header: before
    // the reader reaches them, or while they are on screen, the bar would only
    // duplicate them. Measured on scroll rather than with an
    // IntersectionObserver, which stays silent when a jump (anchor link,
    // restored scroll) carries controls that started below the fold straight
    // past the top without ever intersecting.
    const update = () => setControlsVisible(node.getBoundingClientRect().bottom > 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [cartProduct]);

  const showStickyBar = cartProduct !== null && !controlsVisible;

  // Reserve room at the end of the page so the fixed bar never covers the
  // footer or the last lines of content (the CSS applies below lg only).
  useEffect(() => {
    if (!showStickyBar) return;
    document.body.dataset.stickyPurchase = "on";
    return () => {
      delete document.body.dataset.stickyPurchase;
    };
  }, [showStickyBar]);

  if (cartProduct === null || price.kind === "unavailable") {
    return (
      <>
        {children}
        <div
          data-testid="availability"
          className="flex flex-col gap-1.5 rounded-card border border-hairline bg-glass-inset p-5 font-sans"
        >
          <p className="text-base text-cream">Price coming soon</p>
          <p className="text-base leading-relaxed text-sage-muted">
            Purchasing will be available once pricing is confirmed.
          </p>
        </div>
      </>
    );
  }

  const addToBag = () => {
    addItem(cartProduct, quantity);
    openCart();
  };

  const buyNow = () => {
    const params = new URLSearchParams({ buy: cartProduct.handle, qty: String(quantity) });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-5" data-testid="purchase-panel">
      <PriceTag price={price} size="lg" />

      {children}

      <div ref={controlsRef} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Quantity"
            className="flex h-11 items-center gap-1 rounded-full border border-glass-border px-1"
          >
            <button
              type="button"
              aria-label={`Decrease quantity of ${name}`}
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex size-9 items-center justify-center rounded-full text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output
              aria-live="polite"
              aria-label="Selected quantity"
              data-testid="quantity-value"
              className="min-w-[2ch] text-center font-sans text-sm text-cream"
            >
              {quantity}
            </output>
            <button
              type="button"
              aria-label={`Increase quantity of ${name}`}
              disabled={quantity >= MAX_LINE_QUANTITY}
              onClick={() => setQuantity((q) => Math.min(MAX_LINE_QUANTITY, q + 1))}
              className="flex size-9 items-center justify-center rounded-full text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>

          <Button variant="primary" size="cta" className="flex-1 sm:min-w-56 sm:flex-none" onClick={addToBag}>
            Add to bag
          </Button>
        </div>

        <Button variant="quiet" size="cta" className="w-full sm:w-auto sm:self-start" onClick={buyNow}>
          Buy now
        </Button>
      </div>

      {price.kind === "sample" ? (
        <p className="font-sans text-base leading-relaxed text-sage-muted">{SAMPLE_PRICE_NOTE}</p>
      ) : null}

      {showStickyBar ? (
        <div
          data-sticky-purchase
          data-testid="sticky-purchase-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-forest-deep/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div className="min-w-0 font-sans">
              <p className="truncate text-sm text-cream">{name}</p>
              <p className="text-xs text-sage-muted">
                {formatMoney(price.priceMinor)}
                {price.kind === "sample" ? " · Sample price" : ""}
                {quantity > 1 ? ` · Qty ${quantity}` : ""}
              </p>
            </div>
            <Button variant="primary" className="shrink-0" onClick={addToBag}>
              Add to bag
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
