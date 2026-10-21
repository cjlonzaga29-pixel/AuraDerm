import { formatMoney } from "@/lib/money";
import type { PriceState } from "@/lib/catalog";

// A sample price always carries its "Sample price" label so it cannot be read
// as a confirmed retail price.
export function PriceTag({ price, size = "sm" }: { price: PriceState; size?: "sm" | "lg" }) {
  if (price.kind === "unavailable") {
    const unavailableClass = size === "lg" ? "text-xl text-cream" : "text-sm text-sage-muted";
    return <p className={`font-sans ${unavailableClass}`}>Price coming soon</p>;
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 font-sans" data-testid="price">
      <span className={`text-cream ${size === "lg" ? "text-3xl font-medium tracking-tight" : "text-base"}`}>
        {formatMoney(price.priceMinor)}
      </span>
      {price.kind === "sample" ? (
        <span className="text-sm text-sage-muted">Sample price</span>
      ) : null}
    </p>
  );
}
