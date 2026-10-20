import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Statement() {
  const { statement } = site;

  return (
    // Left canopy column from lg, matching the hero, so the bottle and falls
    // stay in view between the hero and the full-width ingredient panel.
    <section className="py-20 lg:py-28">
      <Reveal>
        <Container>
          <GlassPanel
            tone="veil"
            className="flex flex-col items-center gap-6 px-6 py-8 text-center md:mx-auto md:max-w-xl lg:mx-0 lg:max-w-120 lg:items-start lg:px-8 lg:text-left"
          >
            <DisplayHeading
              level="h2"
              accent={statement.accentWord}
              className="whitespace-pre-line"
            >
              {`${statement.line1}\n${statement.line2}`}
            </DisplayHeading>
            <p className="max-w-[56ch] font-sans text-base text-cream">{statement.subcopy}</p>
          </GlassPanel>
        </Container>
      </Reveal>
    </section>
  );
}
