"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/shop/PriceTag";
import { useCart } from "@/hooks/useCart";
import type { PriceState } from "@/lib/catalog";
import type { Product } from "@/types/store";

const MAX_QUANTITY = 10;

// Quantity + add-to-bag, wired to the shared CartContext/CartSheet. Products
// without a usable price arrive with a null cartProduct: no controls render,
// only a single availability note, and addItem is never reachable. A sample
// price shows its label plus a note that checkout is unavailable.
export function PurchasePanel({
  name,
  price,
  cartProduct,
}: {
  name: string;
  price: PriceState;
  cartProduct: Product | null;
}) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (cartProduct === null || price.kind === "unavailable") {
    return (
      <div
        data-testid="availability"
        className="flex flex-col gap-1 rounded-card border border-gold/30 bg-gold/6 px-5 py-4"
      >
        <p className="font-sans text-lg font-medium text-cream">Price coming soon</p>
        <p className="font-sans text-base leading-relaxed text-sage-muted">
          Purchasing will be available once pricing is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="purchase-panel">
      <PriceTag price={price} size="lg" />

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
            disabled={quantity >= MAX_QUANTITY}
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            className="flex size-9 items-center justify-center rounded-full text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <Button
          variant="primary"
          size="cta"
          className="flex-1 sm:min-w-56 sm:flex-none"
          onClick={() => {
            addItem(cartProduct, quantity);
            openCart();
          }}
        >
          Add to bag
        </Button>
      </div>

      {price.kind === "sample" ? (
        <p className="font-sans text-base leading-relaxed text-sage-muted">
          Sample pricing for testing. Checkout is unavailable.
        </p>
      ) : null}
    </div>
  );
}
