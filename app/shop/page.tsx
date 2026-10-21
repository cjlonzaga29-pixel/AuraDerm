import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { getShopProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop · AuraDerm Botanicals",
};

// The catalog has no categories (four hair-care products), so the collection
// is a plain two-column grid without filter or sorting controls.
export default function ShopPage() {
  const products = getShopProducts();

  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-28 pb-24 lg:pt-36 lg:pb-32">
        <Container>
          <div className="mx-auto flex max-w-270 flex-col gap-10 lg:gap-14">
            <header className="flex max-w-xl flex-col gap-4">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Aura Derm</p>
              <h1 className="font-heading text-[2.75rem] leading-[1.04] font-medium tracking-[-0.02em] text-cream sm:text-[3.5rem] lg:text-[4rem]">
                Hair &amp; scalp care
              </h1>
              <p className="font-sans text-base leading-relaxed text-sage-muted sm:text-lg">
                Two daily shampoos, a conditioner and a leave-on scalp serum for everyday hair and
                scalp care.
              </p>
            </header>

            {products.length > 0 ? (
              <section aria-labelledby="products-heading">
                <h2 id="products-heading" className="sr-only">
                  Products
                </h2>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
                  {products.map((product) => (
                    <li key={product.handle}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="font-sans text-base text-sage-muted">No products are available yet.</p>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
