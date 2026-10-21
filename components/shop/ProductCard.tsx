import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { PriceTag } from "@/components/shop/PriceTag";
import type { ShopProduct } from "@/lib/catalog";

// Shared by the homepage collection, /shop and the related-products row: a
// square media frame, then title, price and "View product" only (the summary
// lives on the product page). Packshots are always contained; the 4:5 bottle
// shots sit on the linen backing the product gallery uses. The card stretches
// to its grid row and the price block takes the slack, so one- and two-line
// titles keep prices level. The compact variant (homepage collection)
// currently shares this treatment.
export function ProductCard({
  product,
}: {
  product: ShopProduct;
  variant?: "default" | "compact";
}) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-forest-panel transition-colors hover:border-gold/45 focus-within:border-gold/45"
      data-testid="product-card"
    >
      <ProductVisual
        name={product.name}
        category={product.category}
        image={product.images[0]}
        className="aspect-square rounded-none bg-linen"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-[1.25rem] leading-[1.2] font-medium text-cream">
          <Link
            href={`/shop/${product.handle}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.displayName}
          </Link>
        </h3>
        <div className="mt-auto flex flex-col gap-2">
          <PriceTag price={product.price} />
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1.5 font-sans text-base font-medium text-gold"
          >
            View product
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
