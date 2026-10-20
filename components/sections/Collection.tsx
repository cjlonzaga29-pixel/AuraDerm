import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { site } from "@/content/site";

// The concept products as one grouped glass panel with hairline rows rather
// than a card per item. Commerce is disabled, so there is no price or buy
// action — each row carries the honest concept label instead.
export function Collection() {
  const { collectionIntro, products } = site;

  return (
    <section id="collection" className="py-24 lg:py-36">
      <Container>
        <GlassPanel className="flex max-w-xl flex-col gap-8 p-7 lg:max-w-136 lg:p-10">
          <div className="flex flex-col gap-3">
            <DisplayHeading level="h2">{collectionIntro.headline}</DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream">{collectionIntro.body}</p>
          </div>

          <ul className="flex flex-col" data-testid="collection-list">
            {products.map((product) => (
              <li
                key={product.slug}
                className="flex flex-col gap-1 border-t border-hairline py-5 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-sans text-lg font-normal text-cream">{product.name}</h3>
                  <span className="font-sans text-sm text-sage-muted">{product.size}</span>
                </div>
                <p className="font-sans text-sm leading-relaxed text-sage-muted">
                  {product.shortDescription}
                </p>
                <span className="mt-1 font-sans text-xs tracking-wide text-sage-muted">{collectionIntro.label}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </Container>
    </section>
  );
}
