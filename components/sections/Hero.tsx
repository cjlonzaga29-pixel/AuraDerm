import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

// Composition follows the background loop: the serum bottle stands on a mossy
// rock right of centre with the falls behind it; the left ~40% is dark canopy.
// From lg the copy sits in that canopy column so bottle and falls stay clear.
// Below lg the stage crop centres the bottle, so the first screen splits
// around it: headline above the cap, copy and CTAs on the water beneath.
// No panel — only the feathered .text-scrim behind each text block.
export function Hero() {
  const { hero } = site;

  return (
    <section className="relative">
      <Container>
        <div className="flex min-h-svh flex-col justify-between pt-24 pb-10 lg:justify-center lg:gap-8 lg:pt-28 lg:pb-24">
          <div className="text-scrim max-w-88 md:max-w-md lg:max-w-108 xl:max-w-128">
            <DisplayHeading level="h1" accent={hero.accentWord}>
              {hero.headline}
            </DisplayHeading>
          </div>

          <div className="text-scrim flex max-w-88 flex-col gap-6 md:max-w-md lg:max-w-108 xl:max-w-120">
            <p className="font-sans text-base leading-relaxed text-cream lg:text-lg">
              {hero.subcopy}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button variant="primary" size="cta" href={hero.primaryCta.href}>
                {hero.primaryCta.label}
              </Button>
              <Button variant="text" size="inline" href={hero.secondaryCta.href}>
                {hero.secondaryCta.label}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
