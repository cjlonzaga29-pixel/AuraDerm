import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Leaf } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/shop/ProductCard";
import { BRAND_LABEL, getRelatedProducts, getShopProduct, getShopProducts } from "@/lib/catalog";

// Only catalog handles are prerendered; anything else is a routing-level 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getShopProducts().map((product) => ({ handle: product.handle }));
}

export async function generateMetadata(props: PageProps<"/shop/[handle]">): Promise<Metadata> {
  const { handle } = await props.params;
  const product = getShopProduct(handle);
  return { title: product ? `${product.name} · AuraDerm Botanicals` : "Not found" };
}

// One titled block of the details area; the id doubles as the anchor for the
// section links.
function DetailSection({
  id,
  title,
  className,
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`flex scroll-mt-28 flex-col gap-4 rounded-card border border-hairline bg-forest-panel p-6 sm:p-8 ${className ?? ""}`}
    >
      <h2 id={`${id}-heading`} className="font-heading text-2xl leading-tight font-medium text-cream">
        {title}
      </h2>
      <div className="font-sans text-base leading-relaxed text-sage-muted">{children}</div>
    </section>
  );
}

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = getShopProduct(handle);
  if (!product) notFound();

  const related = getRelatedProducts(product.handle);
  // Names only up top; each ingredient's benefit is given once, below.
  const highlights = product.keyIngredients.slice(0, 3);

  // Only sections with approved copy appear, in reading order.
  const sections = [
    { id: "overview", title: "Overview", show: true },
    { id: "ingredients", title: "Key ingredients", show: product.keyIngredients.length > 0 },
    { id: "how-to-use", title: "How to use", show: product.directions.length > 0 },
    { id: "cautions", title: "Cautions", show: product.cautions.length > 0 },
    { id: "specifications", title: "Specifications", show: true },
    { id: "reviews", title: "Reviews", show: true },
  ].filter((section) => section.show);

  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-24 pb-24 lg:pt-32 lg:pb-32">
        <Container className="flex flex-col gap-8 lg:gap-10">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 font-sans text-sm text-sage-muted">
              <li>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 rounded-sm text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="min-w-0 truncate">
                {product.displayName}
              </li>
            </ol>
          </nav>

          {/* Purchase area. data-magnifier-bounds: the hover preview may
              cover the right column, never spill past the container. */}
          <div
            data-testid="product-detail"
            data-magnifier-bounds
            className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-12"
          >
            {/* The width cap sits on the wrapper so the overlaid controls
                stay on the image at tablet widths. */}
            <div className={product.images.length > 0 ? "mx-auto w-full sm:max-w-md lg:max-w-none" : "w-full"}>
              <ProductGallery
                name={product.name}
                category={product.category}
                images={product.images}
                className={
                  product.images.length > 0
                    ? "aspect-[4/5] w-full bg-linen"
                    : "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
                }
              />
            </div>

            <div className="flex min-w-0 flex-col gap-6 lg:pt-2">
              <div className="flex flex-col gap-3">
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-gold">
                  {BRAND_LABEL} · {product.category}
                </p>
                <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.015em] text-balance text-cream sm:text-[2.5rem] lg:text-[2.75rem]">
                  {product.displayName}
                </h1>
                <p className="font-sans text-lg leading-snug text-sage-muted">{product.summary}</p>
              </div>

              <Separator className="bg-hairline" />

              <PurchasePanel name={product.name} price={product.price} cartProduct={product.cartProduct}>
                {highlights.length > 0 ? (
                  // Below lg the buy controls come first, nearer the fold.
                  <div className="flex flex-col gap-3 border-y border-hairline py-5 max-lg:order-last">
                    <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-sage-muted">
                      Key ingredients include
                    </h2>
                    <ul className="flex flex-col gap-2" data-testid="highlights">
                      {highlights.map((item) => (
                        <li key={item.name} className="flex items-center gap-3 font-sans text-base text-cream">
                          <Leaf className="size-4 shrink-0 text-gold" aria-hidden="true" />
                          {item.name}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#ingredients"
                      className="self-start rounded-sm font-sans text-sm text-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      All key ingredients and what they do
                    </a>
                  </div>
                ) : null}
              </PurchasePanel>
            </div>
          </div>

          {/* Details: every section open and scannable; each piece of copy
              appears once. */}
          <div className="flex flex-col gap-6 pt-6 lg:pt-10" data-testid="product-details">
            <nav aria-label="Product details" className="border-y border-hairline">
              <ul className="flex flex-wrap gap-x-6 gap-y-1 py-3 font-sans text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="inline-flex min-h-11 items-center rounded-sm text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DetailSection id="overview" title="Overview" className="lg:col-span-2">
                <p className="max-w-3xl text-lg text-cream">{product.description}</p>
              </DetailSection>

              {product.keyIngredients.length > 0 ? (
                <DetailSection id="ingredients" title="Key ingredients">
                  <ul className="flex flex-col divide-y divide-hairline">
                    {product.keyIngredients.map((ingredient) => (
                      <li key={ingredient.name} className="flex flex-col gap-0.5 py-3 first:pt-0">
                        <span className="text-cream">{ingredient.name}</span>
                        <span>{ingredient.benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm">Key ingredients only — not the full ingredient list.</p>
                </DetailSection>
              ) : null}

              {product.directions.length > 0 ? (
                <DetailSection id="how-to-use" title="How to use">
                  <ol className="flex flex-col gap-3">
                    {product.directions.map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/60 text-sm text-gold"
                        >
                          {i + 1}
                        </span>
                        <span className="pt-0.5 text-cream">{step}</span>
                      </li>
                    ))}
                  </ol>
                </DetailSection>
              ) : null}

              {product.cautions.length > 0 ? (
                <DetailSection id="cautions" title="Cautions">
                  <ul className="flex list-disc flex-col gap-1.5 pl-5">
                    {product.cautions.map((caution) => (
                      <li key={caution}>{caution}</li>
                    ))}
                  </ul>
                </DetailSection>
              ) : null}

              {/* Confirmed facts only: net content appears once the owner confirms it. */}
              <DetailSection id="specifications" title="Specifications">
                <dl className="flex flex-col divide-y divide-hairline" data-testid="specifications">
                  <div className="flex justify-between gap-4 py-3 first:pt-0">
                    <dt>Brand</dt>
                    <dd className="text-cream">{BRAND_LABEL}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt>Category</dt>
                    <dd className="text-cream">{product.category}</dd>
                  </div>
                  {product.size ? (
                    <div className="flex justify-between gap-4 py-3">
                      <dt>Size</dt>
                      <dd className="text-cream">{product.size}</dd>
                    </div>
                  ) : null}
                </dl>
              </DetailSection>

              {/* No reviews exist yet; none are invented. */}
              <DetailSection id="reviews" title="Reviews" className="lg:col-span-2">
                <p>No reviews yet.</p>
              </DetailSection>
            </div>
          </div>

          {related.length > 0 ? (
            <section aria-labelledby="related-heading" className="flex flex-col gap-8 pt-10 lg:pt-16">
              <h2 id="related-heading" className="font-heading text-[2rem] leading-tight font-medium text-cream">
                More from the collection
              </h2>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <li key={item.handle}>
                    <ProductCard product={item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Container>
      </main>
    </>
  );
}
