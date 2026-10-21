import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

// Compact bookend to the hero: same canopy column from lg, ending on the
// bottle and falls rather than a boxed card.
export function Closing() {
  const { closing } = site;

  return (
    <section id="closing" data-testid="closing" className="pt-12 pb-20 lg:pt-20 lg:pb-28">
      <Container>
        <div className="text-scrim flex max-w-md flex-col items-start gap-6">
          <DisplayHeading level="h2">{closing.headline}</DisplayHeading>
          <p className="font-sans text-base leading-relaxed text-cream">{closing.subcopy}</p>
          <Button variant="primary" size="cta" href={closing.cta.href}>
            {closing.cta.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
