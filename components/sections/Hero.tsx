import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { site } from "@/content/site";

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
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      <Container className="relative flex flex-col gap-10 py-32 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative z-0 flex max-w-xl flex-col gap-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 rounded-4xl"
            style={{ background: "var(--glass-solid)" }}
          />
          <Eyebrow withRule>{hero.eyebrow}</Eyebrow>

          <DisplayHeading level="h1" accent={hero.accentWord} className="whitespace-pre-line">
            {`${hero.headlineLine1}\n${hero.headlineLine2}`}
          </DisplayHeading>

          <p className="max-w-[42ch] font-sans text-base text-cream">{hero.subcopy}</p>

          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary" href={hero.primaryCta.href}>
              {hero.primaryCta.label}
            </Button>
            <Button variant="text" href={hero.secondaryCta.href}>
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="flex flex-wrap gap-6 lg:hidden">
            {hero.trustBadges.map((badge) => (
              <span
                key={badge.label}
                className="font-sans text-xs uppercase tracking-[0.18em] text-sage-muted"
              >
                {badge.label}
              </span>
            ))}
          </div>

          {featuredProduct ? (
            <GlassPanel className="flex max-w-xs flex-col gap-2 p-6">
              <Eyebrow>Concept product</Eyebrow>
              <span className="font-display text-lg text-cream">{featuredProduct.name}</span>
              <span className="font-sans text-sm text-sage-muted">{featuredProduct.size}</span>
              {priceLabel ? <span className="font-sans text-sm text-gold">{priceLabel}</span> : null}
            </GlassPanel>
          ) : null}
        </div>

        <GlassPanel className="hidden flex-col gap-6 self-stretch p-6 lg:flex">
          {hero.trustBadges.map((badge) => (
            <span
              key={badge.label}
              className="font-sans text-xs uppercase tracking-[0.18em] text-sage-muted"
            >
              {badge.label}
            </span>
          ))}
        </GlassPanel>
      </Container>
    </section>
  );
}
