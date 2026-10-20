import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Closing() {
  const { closing } = site;

  return (
    // Bookends the hero: the closing copy returns to the left canopy column
    // from lg so the page ends on the bottle and falls rather than a centred card.
    <section id="closing" data-testid="closing" className="py-24 lg:py-32">
      <Reveal>
        <Container>
          <GlassPanel
            tone="veil"
            className="flex flex-col items-center gap-6 px-6 py-8 text-center md:mx-auto md:max-w-xl lg:mx-0 lg:max-w-120 lg:items-start lg:p-10 lg:text-left"
          >
            <DisplayHeading level="h2" className="whitespace-pre-line">
              {`${closing.line1}\n${closing.line2}`}
            </DisplayHeading>
            <p className="max-w-[48ch] font-sans text-base text-cream">{closing.subcopy}</p>
            <Button variant="primary" href={closing.cta.href}>
              {closing.cta.label}
            </Button>
          </GlassPanel>
        </Container>
      </Reveal>
    </section>
  );
}
