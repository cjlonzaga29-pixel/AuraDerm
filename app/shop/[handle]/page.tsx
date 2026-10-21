import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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
import { PriceTag } from "@/components/shop/PriceTag";
import { ProductCard } from "@/components/shop/ProductCard";
import { getRelatedProducts, getShopProduct, getShopProducts } from "@/lib/catalog";

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

  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-24 pb-24 lg:pt-32 lg:pb-32">
        <Container className="flex flex-col gap-10">
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
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <ProductGallery name={product.name} concept={product.concept} images={product.images} />
            </div>

            <div className="flex min-w-0 flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h1 className="font-heading text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.02em] text-balance text-cream">
                  {product.name}
                </h1>
                <p className="font-sans text-base leading-relaxed text-sage-muted">{product.summary}</p>
                <PriceTag price={product.price} size="lg" />
              </div>

              {product.size ? (
                <dl className="border-y border-hairline py-4 font-sans text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-sage-muted">Size</dt>
                    <dd className="text-cream">{product.size}</dd>
                  </div>
                </dl>
              ) : null}

              <PurchasePanel name={product.name} cartProduct={product.cartProduct} />

              <p className="font-sans text-xs leading-relaxed text-sage-muted">
                Price and net content are still to be confirmed. Checkout is not connected in this
                preview.
              </p>

              <Accordion type="multiple" defaultValue={["description"]} className="border-t border-hairline">
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>{product.description}</AccordionContent>
                </AccordionItem>
                {product.keyIngredients.length > 0 ? (
                  <AccordionItem value="ingredients">
                    <AccordionTrigger>Key ingredients</AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex flex-col gap-2">
                        {product.keyIngredients.map((ingredient) => (
                          <li key={ingredient.name}>
                            <span className="text-cream">{ingredient.name}</span>
                            {" — "}
                            {ingredient.benefit}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs">
                        Key ingredients only — not the full ingredient list.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
                {product.directions.length > 0 ? (
                  <AccordionItem value="directions">
                    <AccordionTrigger>Directions</AccordionTrigger>
                    <AccordionContent>
                      <ol className="flex list-decimal flex-col gap-1 pl-5">
                        {product.directions.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
                {product.cautions.length > 0 ? (
                  <AccordionItem value="caution">
                    <AccordionTrigger>Caution</AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex list-disc flex-col gap-1 pl-5">
                        {product.cautions.map((caution) => (
                          <li key={caution}>{caution}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ) : null}
              </Accordion>
            </div>
          </div>

          {related.length > 0 ? (
            <section aria-labelledby="related-heading" className="flex flex-col gap-8 border-t border-hairline pt-14 lg:pt-20">
              <h2 id="related-heading" className="font-heading text-3xl font-medium text-cream">
                More from the collection
              </h2>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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
