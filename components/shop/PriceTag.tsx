import { formatMoney } from "@/lib/money";
import type { PriceState } from "@/lib/catalog";

// Sample and retail prices render alike; the checkout status states that
// prices are for testing.
export function PriceTag({ price, size = "sm" }: { price: PriceState; size?: "sm" | "lg" }) {
  if (price.kind === "unavailable") {
    const unavailableClass = size === "lg" ? "text-xl text-cream" : "text-sm text-sage-muted";
    return <p className={`font-sans ${unavailableClass}`}>Price coming soon</p>;
  }

  return (
    <p
      className={`font-sans text-cream ${size === "lg" ? "text-3xl font-medium tracking-tight" : "text-base"}`}
      data-testid="price"
    >
      {formatMoney(price.priceMinor)}
    </p>
  );
}
