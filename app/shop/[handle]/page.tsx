import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Leaf } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { ProductTabs, type ProductTab } from "@/components/shop/ProductTabs";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

const QUESTION_LINK =
  "inline-flex min-h-11 items-center rounded-sm font-sans text-sm text-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function ProductPage(props: PageProps<"/shop/[handle]">) {
  const { handle } = await props.params;
  const product = getShopProduct(handle);
  if (!product) notFound();

  const related = getRelatedProducts(product.handle);
  // Names only up top; each ingredient's benefit is given once, below.
  const highlights = product.keyIngredients.slice(0, 3);

  // Only tabs with approved copy appear, in reading order. The ids are the
  // long-standing anchors (#ingredients, #how-to-use, #cautions, #questions)
  // used by the highlights link, Q&A answers and the homepage.
  const tabs: ProductTab[] = [
    {
      id: "overview",
      label: "Overview",
      content: <p className="max-w-3xl text-lg text-cream">{product.description}</p>,
    },
  ];
  if (product.keyIngredients.length > 0) {
    tabs.push({
      id: "ingredients",
      label: "Key ingredients",
      content: (
        <div className="max-w-3xl">
          <ul className="flex flex-col divide-y divide-hairline">
            {product.keyIngredients.map((ingredient) => (
              <li key={ingredient.name} className="flex flex-col gap-0.5 py-3 first:pt-0">
                <span className="text-cream">{ingredient.name}</span>
                <span>{ingredient.benefit}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">Key ingredients only — not the full ingredient list.</p>
        </div>
      ),
    });
  }
  if (product.directions.length > 0) {
    tabs.push({
      id: "how-to-use",
      label: "How to use",
      content: (
        <ol className="flex max-w-3xl flex-col gap-3">
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
      ),
    });
  }
  if (product.cautions.length > 0) {
    tabs.push({
      id: "cautions",
      label: "Cautions",
      content: (
        <ul className="flex max-w-3xl list-disc flex-col gap-1.5 pl-5">
          {product.cautions.map((caution) => (
            <li key={caution}>{caution}</li>
          ))}
        </ul>
      ),
    });
  }
  // Confirmed facts only: net content appears once the owner confirms it.
  tabs.push({
    id: "specifications",
    label: "Specifications",
    content: (
      <dl className="flex max-w-xl flex-col divide-y divide-hairline" data-testid="specifications">
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
    ),
  });
  // Editorial guidance from the copy above, not customer answers; the full
  // directions and cautions stay in their tabs, which the answer links open.
  if (product.questions.length > 0) {
    tabs.push({
      id: "questions",
      label: "Questions & answers",
      content: (
        <>
          <p className="max-w-3xl text-sm">
            Answers are editorial guidance based on this product&rsquo;s directions and cautions, not
            customer-submitted answers.
          </p>
          <Accordion type="multiple" className="mt-2 max-w-3xl border-t border-hairline" data-testid="product-questions">
            {product.questions.map((item, i) => (
              <AccordionItem key={item.question} value={`q${i}`}>
                <AccordionTrigger className="min-h-14 text-lg">{item.question}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 text-base">
                  <p className="text-cream">{item.answer}</p>
                  {item.links?.length ? (
                    <ul className="flex flex-wrap gap-x-5 gap-y-1">
                      {item.links.map((link) => (
                        <li key={link.href}>
                          {link.href.startsWith("#") ? (
                            <a href={link.href} className={QUESTION_LINK}>
                              {link.label}
                            </a>
                          ) : (
                            <Link href={link.href} className={QUESTION_LINK}>
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      ),
    });
  }
  // No reviews exist yet; none are invented.
  tabs.push({ id: "reviews", label: "Reviews", content: <p>No reviews yet.</p> });

  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-24 pb-24 lg:pt-32 lg:pb-32">
        <Container className="flex flex-col gap-6 lg:gap-8">
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

          {/* Purchase area: two equal flexible columns across the 1200px
              container from lg, stacked below. The gallery frame is square
              at every width; the bottle is contained inside it on the linen
              surface. data-magnifier-bounds: the hover preview may cover the
              area right of the gallery, never spill past the container; its
              gap follows this grid's column gap. */}
          <div
            data-testid="product-detail"
            data-magnifier-bounds
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10"
          >
            <div className="w-full min-w-0">
              <ProductGallery
                name={product.name}
                category={product.category}
                images={product.images}
                className={product.images.length > 0 ? "aspect-square w-full bg-linen" : "aspect-square w-full"}
              />
            </div>

            <div className="flex w-full min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-gold">
                  {BRAND_LABEL} · {product.category}
                </p>
                <h1 className="font-heading text-[1.75rem] leading-[1.1] font-medium tracking-[-0.015em] text-balance text-cream sm:text-[1.875rem] lg:text-[2.125rem]">
                  {product.displayName}
                </h1>
                <p className="max-w-[60ch] font-sans text-base leading-snug text-sage-muted lg:text-[1.0625rem]">{product.summary}</p>
              </div>

              <Separator className="bg-hairline" />

              <PurchasePanel name={product.name} price={product.price} cartProduct={product.cartProduct}>
                {highlights.length > 0 ? (
                  // Below lg the buy controls come first, nearer the fold.
                  <div className="flex flex-col gap-2 border-y border-hairline py-4 max-lg:order-last">
                    <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-sage-muted">
                      Key ingredients include
                    </h2>
                    <ul className="flex flex-col gap-1.5" data-testid="highlights">
                      {highlights.map((item) => (
                        <li key={item.name} className="flex items-center gap-3 font-sans text-base text-cream">
                          <Leaf className="size-4 shrink-0 text-gold" aria-hidden="true" />
                          {item.name}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#ingredients"
                      className="inline-flex min-h-11 items-center self-start rounded-sm font-sans text-sm text-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      All key ingredients and what they do
                    </a>
                  </div>
                ) : null}
              </PurchasePanel>
            </div>
          </div>

          {/* Details: one panel at a time; each piece of copy appears once
              (the Q&A answers stay short and link to their tabs). */}
          <ProductTabs tabs={tabs} />

          {related.length > 0 ? (
            <section aria-labelledby="related-heading" className="flex flex-col gap-6 pt-8 lg:pt-12">
              <h2 id="related-heading" className="font-heading text-[1.75rem] leading-tight font-medium text-cream">
                More from the collection
              </h2>
              {/* Three equal cards capped at 16rem, centred as a group rather
                  than stretched across the container; one ~320px card below md. */}
              <ul className="mx-auto grid w-full max-w-80 grid-cols-1 gap-5 md:max-w-none md:grid-cols-[repeat(3,minmax(0,16rem))] md:justify-center lg:gap-6">
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
