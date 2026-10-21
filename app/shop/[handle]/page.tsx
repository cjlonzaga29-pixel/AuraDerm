import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Leaf } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = getShopProduct(handle);
  if (!product) notFound();

  const related = getRelatedProducts(product.handle);
  const highlights = product.keyIngredients.slice(0, 3);

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

          <div data-testid="product-detail" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[11fr_9fr] lg:gap-8">
            <div className="lg:sticky lg:top-28">
              <ProductGallery
                name={product.name}
                category={product.category}
                images={product.images}
                className={
                  product.images.length > 0
                    ? "mx-auto aspect-[4/5] w-full sm:max-w-md lg:max-w-none"
                    : "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
                }
              />
            </div>

            <div className="flex min-w-0 flex-col gap-7 rounded-card border border-hairline bg-forest-panel p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-3">
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-gold">
                  {BRAND_LABEL} · {product.category}
                </p>
                <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.015em] text-balance text-cream sm:text-[2.5rem] lg:text-[2.75rem]">
                  {product.displayName}
                </h1>
                <p className="font-sans text-lg leading-snug text-cream">{product.summary}</p>
              </div>

              <p className="font-sans text-base leading-relaxed text-sage-muted">{product.description}</p>

              {/* Confirmed facts only: net content appears once the owner confirms it. */}
              <dl
                className="flex flex-col divide-y divide-hairline border-y border-hairline font-sans text-base"
                data-testid="specifications"
              >
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-sage-muted">Category</dt>
                  <dd className="text-cream">{product.category}</dd>
                </div>
                {product.size ? (
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-sage-muted">Size</dt>
                    <dd className="text-cream">{product.size}</dd>
                  </div>
                ) : null}
              </dl>

              {highlights.length > 0 ? (
                <section aria-labelledby="highlights-heading" className="flex flex-col gap-3">
                  <h2
                    id="highlights-heading"
                    className="font-sans text-xs uppercase tracking-[0.2em] text-sage-muted"
                  >
                    Highlights
                  </h2>
                  <ul className="flex flex-col gap-3" data-testid="highlights">
                    {highlights.map((item) => (
                      <li key={item.name} className="flex gap-3 font-sans text-base leading-relaxed">
                        <Leaf className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
                        <span>
                          <span className="font-medium text-cream">{item.name}</span>
                          <span className="text-sage-muted"> — {item.benefit}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <PurchasePanel
                name={product.name}
                price={product.price}
                cartProduct={product.cartProduct}
              />

              <div>
                <Separator className="bg-hairline" />
                <Accordion type="multiple">
                  {product.keyIngredients.length > 0 ? (
                    <AccordionItem value="ingredients">
                      <AccordionTrigger>Key ingredients</AccordionTrigger>
                      <AccordionContent className="text-base">
                        <ul className="flex flex-col gap-2">
                          {product.keyIngredients.map((ingredient) => (
                            <li key={ingredient.name}>
                              <span className="text-cream">{ingredient.name}</span>
                              {" — "}
                              {ingredient.benefit}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-sm">
                          Key ingredients only — not the full ingredient list.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}
                  {product.directions.length > 0 ? (
                    <AccordionItem value="directions">
                      <AccordionTrigger>How to use</AccordionTrigger>
                      <AccordionContent className="text-base">
                        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
                          {product.directions.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}
                  {product.cautions.length > 0 ? (
                    <AccordionItem value="caution">
                      <AccordionTrigger>Cautions</AccordionTrigger>
                      <AccordionContent className="text-base">
                        <ul className="flex list-disc flex-col gap-1.5 pl-5">
                          {product.cautions.map((caution) => (
                            <li key={caution}>{caution}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null}
                  {/* No reviews exist yet; none are invented. */}
                  <AccordionItem value="reviews">
                    <AccordionTrigger>Reviews</AccordionTrigger>
                    <AccordionContent className="text-base">
                      <p>No reviews yet.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
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
