"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/money";

export function CartSheet() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotalMinor } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex w-full flex-col bg-cream sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-forest-deep">
            Your Bag
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
            <p className="font-sans text-sm text-muted-foreground">Your bag is empty.</p>
            <SheetClose asChild>
              <Button variant="botanical">Continue Browsing</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex gap-4 border-b border-border pb-4 last:border-b-0"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded-card bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <p className="font-sans text-sm font-medium text-forest-deep">
                      {item.title}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground">{item.volume}</p>
                    <p className="font-sans text-xs text-forest">
                      {formatMoney(item.priceMinor)}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="text-forest transition-colors hover:text-forest-deep"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-[1.5ch] text-center font-sans text-xs text-forest-deep">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="text-forest transition-colors hover:text-forest-deep"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.title} from bag`}
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-3 border-t border-border bg-cream">
              <div className="flex items-center justify-between font-sans text-sm text-forest-deep">
                <span>Subtotal</span>
                <span className="font-medium">{formatMoney(subtotalMinor)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-gold text-forest-deep">Cash on Delivery</Badge>
                <span className="font-sans text-xs text-muted-foreground">
                  Nationwide delivery
                </span>
              </div>

              <Separator className="bg-border" />

              <Button variant="primary" className="w-full justify-center">
                Proceed to COD Checkout
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
