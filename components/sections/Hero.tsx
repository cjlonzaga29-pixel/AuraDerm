import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Separator } from "@/components/ui/separator";
import { site } from "@/content/site";

// Composition follows the background loop: the serum bottle stands on a mossy
// rock just right of centre with the falls behind it, and the left third is
// dark canopy. Below lg the first screen splits around the bottle — headline
// above the cap, copy and CTAs on the rock/water beneath it — and the concept
// strip follows below the fold. From lg the copy sits in the canopy column so
// the bottle and falls stay uncovered.
export function Hero() {
  const { hero } = site;
  const featuredProduct = site.products.find(
    (product) => product.slug === hero.featuredProductSlug,
  );

  const priceLabel =
    site.commerce && featuredProduct?.priceMinor != null && featuredProduct.currency
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: featuredProduct.currency,
        }).format(featuredProduct.priceMinor / 100)
      : null;

  return (
    <section className="relative lg:flex lg:min-h-svh lg:items-center">
      <Container className="flex flex-col gap-4 lg:gap-3 lg:py-32">
        <div className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-between gap-6 pt-8 pb-6 lg:min-h-0 lg:justify-start lg:gap-3 lg:p-0">
          <GlassPanel
            tone="veil"
            className="flex w-full flex-col gap-4 px-6 py-5 md:max-w-md lg:max-w-120 lg:px-8 lg:py-7"
          >
            <Eyebrow withRule>{hero.eyebrow}</Eyebrow>
            <DisplayHeading level="h1" accent={hero.accentWord} className="whitespace-pre-line">
              {`${hero.headlineLine1}\n${hero.headlineLine2}`}
            </DisplayHeading>
          </GlassPanel>

          <GlassPanel
            tone="veil"
            className="flex w-full flex-col gap-5 px-6 py-5 md:max-w-md lg:max-w-120 lg:px-8 lg:py-7"
          >
            <p className="max-w-[42ch] font-sans text-base text-cream">{hero.subcopy}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" href={hero.primaryCta.href}>
                {hero.primaryCta.label}
              </Button>
              <Button variant="quiet" href={hero.secondaryCta.href}>
                {hero.secondaryCta.label}
              </Button>
            </div>
          </GlassPanel>
        </div>

        <GlassPanel
          tone="veil"
          className="mb-16 flex w-full flex-col gap-4 px-6 py-5 md:max-w-md lg:mb-0 lg:max-w-120 lg:px-8"
        >
          {featuredProduct ? (
            <div className="flex flex-col gap-1">
              <Eyebrow>Concept product</Eyebrow>
              <span className="font-display text-lg text-cream">{featuredProduct.name}</span>
              <span className="font-sans text-sm text-sage-muted">{featuredProduct.size}</span>
              {priceLabel ? <span className="font-sans text-sm text-gold">{priceLabel}</span> : null}
            </div>
          ) : null}
          <Separator className="bg-glass-border" />
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {hero.trustBadges.map((badge) => (
              <li
                key={badge.label}
                className="font-sans text-xs uppercase tracking-[0.18em] text-sage-muted"
              >
                {badge.label}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </Container>
    </section>
  );
}
