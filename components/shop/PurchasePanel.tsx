"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types/store";

const MAX_QUANTITY = 10;

// Quantity + add-to-bag, wired to the shared CartContext/CartSheet. Products
// without a usable price arrive with a null cartProduct and stay disabled.
export function PurchasePanel({ name, cartProduct }: { name: string; cartProduct: Product | null }) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const disabled = cartProduct === null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Quantity"
          className="flex h-11 items-center gap-1 rounded-full border border-glass-border px-1"
        >
          <button
            type="button"
            aria-label={`Decrease quantity of ${name}`}
            disabled={disabled || quantity <= 1}
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
            disabled={disabled || quantity >= MAX_QUANTITY}
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
          disabled={disabled}
          aria-describedby={disabled ? "purchase-unavailable" : undefined}
          onClick={() => {
            if (!cartProduct) return;
            addItem(cartProduct, quantity);
            openCart();
          }}
        >
          Add to bag
        </Button>
      </div>

      {disabled ? (
        <p id="purchase-unavailable" className="font-sans text-sm text-sage-muted">
          Unavailable to add until a price is confirmed.
        </p>
      ) : null}
    </div>
  );
}
