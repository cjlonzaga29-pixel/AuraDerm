import { formatMoney } from "@/lib/money";
import type { PriceState } from "@/lib/catalog";

export function PriceTag({ price, size = "sm" }: { price: PriceState; size?: "sm" | "lg" }) {
  if (price.kind === "unavailable") {
    const unavailableClass = size === "lg" ? "text-xl text-cream" : "text-sm text-sage-muted";
    return <p className={`font-sans ${unavailableClass}`}>Price coming soon</p>;
  }

  return (
    <p className="font-sans">
      <span className={`text-cream ${size === "lg" ? "text-2xl" : "text-base"}`}>
        {formatMoney(price.priceMinor)}
      </span>
    </p>
  );
}
