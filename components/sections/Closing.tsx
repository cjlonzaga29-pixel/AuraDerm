import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Closing() {
  const { closing } = site;

  return (
    <section id="closing" data-testid="closing" className="py-24">
      <Reveal>
        <Container className="flex justify-center">
          <GlassPanel className="flex max-w-2xl flex-col items-center gap-6 p-8 text-center lg:p-12">
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
