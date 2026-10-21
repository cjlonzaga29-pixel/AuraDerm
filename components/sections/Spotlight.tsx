import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { Button } from "@/components/ui/button";
import { getShopProduct } from "@/lib/catalog";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

// Grid placement around the central packshot from lg: two callouts left, one
// right, with the product link beneath it. Below lg everything stacks in DOM
// order — image, then the three callouts as rows.
const PLACEMENT = [
  "lg:col-start-1 lg:row-start-2 lg:text-right",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-1 lg:row-start-3 lg:text-right",
];

// One product, its three hero ingredients. The single glass panel on the page
// groups them so this reads apart from the open card grid of the collection.
export function Spotlight() {
  const { spotlight } = site;
  const product = getShopProduct(spotlight.productSlug);
  if (!product) return null;

  return (
    <section id="formula" className="py-8 lg:py-12">
      <Container>
        <GlassPanel className="p-6 sm:p-8 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_minmax(0,1fr)] lg:items-center lg:gap-x-12 lg:gap-y-6">
            <div className="flex flex-col gap-3 lg:col-span-3 lg:items-center lg:text-center">
              <DisplayHeading level="h2">{spotlight.headline}</DisplayHeading>
              <p className="font-sans text-base leading-relaxed text-cream">
                <span className="text-gold">{product.displayName}</span> — {product.summary}.
              </p>
            </div>

            <ProductVisual
              name={product.name}
              category={product.category}
              image={spotlight.media.image ?? product.images[0]}
              fit="contain"
              className="mx-auto aspect-[4/5] w-full max-w-72 lg:col-start-2 lg:row-span-2 lg:row-start-2"
            />

            <ul className="flex flex-col lg:contents">
              {spotlight.callouts.map((callout, i) => (
                <li
                  key={callout.name}
                  className={cn("flex flex-col gap-1 border-t border-hairline py-4", PLACEMENT[i])}
                >
                  <h3 className="font-heading text-2xl leading-tight font-medium text-cream">
                    {callout.name}
                  </h3>
                  <p className="font-sans text-base leading-relaxed text-sage-muted">
                    {callout.benefit}
                  </p>
                </li>
              ))}
            </ul>

            <div className="lg:col-start-3 lg:row-start-3 lg:border-t lg:border-hairline lg:py-4">
              <Button variant="text" size="inline" href={spotlight.cta.href}>
                {spotlight.cta.label}
              </Button>
            </div>
          </div>
        </GlassPanel>
      </Container>
    </section>
  );
}
