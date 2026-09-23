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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--forest-deep) 75%, transparent), transparent)",
        }}
      />

      <Container className="relative flex flex-col gap-10 py-32 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-6">
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

          <GlassPanel className="flex max-w-xs flex-col gap-2 p-6">
            <Eyebrow>Featured</Eyebrow>
            <span className="font-display text-lg text-cream">
              {featuredProduct?.name ?? "[CONTENT: product name]"}
            </span>
            <span className="font-sans text-sm text-sage-muted">
              {featuredProduct?.size ?? "[CONTENT: size]"}
            </span>
            {priceLabel ? <span className="font-sans text-sm text-gold">{priceLabel}</span> : null}
          </GlassPanel>
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
