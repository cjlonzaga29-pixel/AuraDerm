import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { ProductCard } from "@/components/shop/ProductCard";
import { getShopProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop · AuraDerm Botanicals",
};

// The catalog has no categories (four hair-care products), so the collection
// is a plain grid without filter controls.
export default function ShopPage() {
  const products = getShopProducts();

  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-28 pb-24 lg:pt-36 lg:pb-32">
        <Container className="flex flex-col gap-12 lg:gap-16">
          <header className="flex max-w-2xl flex-col gap-4">
            <DisplayHeading level="h1">Shop</DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream">
              The Aura Derm hair and scalp range: two daily shampoos, a conditioner and a leave-on scalp serum.
            </p>
            <p
              data-testid="shop-preview-notice"
              className="w-fit rounded-full border border-hairline px-4 py-1.5 font-sans text-xs tracking-wide text-sage-muted"
            >
              Shop preview · prices coming soon, checkout not connected
            </p>
          </header>

          {products.length > 0 ? (
            <section aria-labelledby="products-heading">
              <h2 id="products-heading" className="sr-only">
                Products
              </h2>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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
        </Container>
      </main>
    </>
  );
}
