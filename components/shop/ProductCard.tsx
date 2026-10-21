import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { PriceTag } from "@/components/shop/PriceTag";
import type { ShopProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";

// Shared by /shop and the related-products row. The card stretches to its grid
// row so titles of different lengths keep the cards level. The compact variant
// (homepage collection) tightens padding, gaps and the title for a ~260px
// card. Packshots are always contained.
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
        className="aspect-[4/5] rounded-none"
      />
      <div className={cn("flex flex-1 flex-col", compact ? "gap-1.5 p-4 sm:p-5" : "gap-2 p-5 sm:p-6")}>
        <h3
          className={cn(
            "font-heading font-medium text-cream",
            compact ? "text-[1.375rem] leading-[1.2]" : "text-[1.625rem] leading-tight",
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
            "mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-hairline",
            compact ? "pt-3" : "pt-4",
          )}
        >
          <PriceTag price={product.price} />
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
