import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { PriceTag } from "@/components/shop/PriceTag";
import type { ShopProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";

// Shared by /shop and the related-products row. The card stretches to its grid
// row so titles of different lengths keep the cards level. The compact variant
// (homepage collection) drops the price row and keeps the packshot contained.
export function ProductCard({
  product,
  variant = "default",
}: {
  product: ShopProduct;
  variant?: "default" | "compact";
}) {
  const compact = variant === "compact";

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-forest-panel transition-colors hover:border-gold/45 focus-within:border-gold/45"
      data-testid="product-card"
    >
      <ProductVisual
        name={product.name}
        category={product.category}
        image={product.images[0]}
        fit={compact ? "contain" : "cover"}
        className="aspect-[4/5] rounded-none"
      />
      <div className={cn("flex flex-1 flex-col gap-2 p-5", !compact && "sm:p-6")}>
        <h3
          className={cn(
            "font-heading leading-tight font-medium text-cream",
            compact ? "text-2xl" : "text-[1.625rem]",
          )}
        >
          <Link
            href={`/shop/${product.handle}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.displayName}
          </Link>
        </h3>
        <p className="font-sans text-base leading-relaxed text-sage-muted">{product.summary}</p>
        <div
          className={cn(
            "mt-auto flex items-center gap-4 border-t border-hairline pt-4",
            compact ? "justify-start" : "justify-between",
          )}
        >
          {compact ? null : <PriceTag price={product.price} />}
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-gold"
          >
            View product
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
