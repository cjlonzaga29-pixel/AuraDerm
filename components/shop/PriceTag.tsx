import { formatMoney } from "@/lib/money";
import type { PriceState } from "@/lib/catalog";

export function PriceTag({ price, size = "sm" }: { price: PriceState; size?: "sm" | "lg" }) {
  const amountClass = size === "lg" ? "text-2xl" : "text-base";

  if (price.kind === "unavailable") {
    return <p className={`font-sans text-sage-muted ${amountClass}`}>Price coming soon</p>;
  }

  return (
    <p className="font-sans">
      <span className={`text-cream ${amountClass}`}>{formatMoney(price.priceMinor)}</span>
    </p>
  );
}
