import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { ProductCard } from "@/components/shop/ProductCard";
import { getShopProducts } from "@/lib/catalog";
import { site } from "@/content/site";

// Products come straight after the hero, drawn through the shared catalog
// adapter (in its explicit display order) and the shop's card in its compact
// variant (labelled price, no buy action). Inside the 1200px container the
// cards run ~260px four across from 1200px, two on tablet, one on phones.
export function Collection() {
  const { collectionIntro } = site;
  const products = getShopProducts();

  return (
    <section id="collection" className="py-8 lg:py-12">
      <Container className="flex flex-col gap-8 lg:gap-10">
        <div className="text-scrim flex max-w-xl flex-col gap-3 self-start">
          <DisplayHeading level="h2">{collectionIntro.headline}</DisplayHeading>
          <p className="font-sans text-base leading-relaxed text-cream lg:text-lg">
            {collectionIntro.body}
          </p>
        </div>

        <ul
          className="grid gap-5 sm:grid-cols-2 min-[75rem]:grid-cols-4"
          data-testid="collection-list"
        >
          {products.map((product) => (
            <li key={product.handle}>
              <ProductCard product={product} variant="compact" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
