import Link from "next/link";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { PriceTag } from "@/components/shop/PriceTag";
import type { ShopProduct } from "@/lib/catalog";

export function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <article className="group relative flex flex-col gap-4" data-testid="product-card">
      <ProductVisual
        concept={product.concept}
        name={product.name}
        className="transition-colors group-hover:border-gold/50"
      />
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading text-2xl leading-tight font-medium text-cream">
          <Link
            href={`/shop/${product.handle}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.name}
          </Link>
        </h3>
        <p className="font-sans text-sm leading-relaxed text-sage-muted">{product.summary}</p>
        <p className="font-sans text-xs text-sage-muted">{product.size}</p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <PriceTag price={product.price} />
          <span
            aria-hidden="true"
            className="font-sans text-sm text-cream underline decoration-gold/60 underline-offset-[6px] group-hover:text-gold"
          >
            View product
          </span>
        </div>
      </div>
    </article>
  );
}
