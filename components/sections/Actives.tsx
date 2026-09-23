import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Actives() {
  const { actives, activesIntro } = site;

  return (
    <section id="actives" className="py-24">
      <Container>
        <Reveal>
          <GlassPanel className="flex flex-col gap-10 p-8 lg:flex-row lg:gap-10 lg:p-12">
            <div className="flex flex-col gap-6 lg:w-2/5">
              <Eyebrow>{activesIntro.eyebrow}</Eyebrow>
              <DisplayHeading
                level="h2"
                accent={activesIntro.accentWord}
                className="whitespace-pre-line"
              >
                {activesIntro.headline}
              </DisplayHeading>
              <p className="font-sans text-sm text-cream">{activesIntro.body}</p>
              <Button variant="primary" href={activesIntro.cta.href} className="self-start">
                {activesIntro.cta.label}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:w-3/5 lg:grid-cols-4">
              {actives.map((active) => (
                <div
                  key={active.badge}
                  className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card border border-glass-border bg-glass-solid"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-center font-sans text-[0.625rem] text-sage-muted">
                    {active.image ?? "[Active image]"}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-deep from-10% via-forest-deep/80 via-40% to-transparent p-4">
                    <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold bg-forest-deep font-sans text-[0.625rem] font-medium text-cream">
                      {active.badge}
                    </span>
                    <p className="font-display text-base text-cream">{active.name}</p>
                    <p className="font-sans text-xs text-sage-muted">{active.oneLiner}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </Reveal>
      </Container>
    </section>
  );
}
