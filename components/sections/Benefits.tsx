import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";
import { LessIcon, TextureIcon, CalmIcon } from "@/components/illustrations";

const BENEFIT_ICONS = [LessIcon, TextureIcon, CalmIcon];

export function Benefits() {
  const { benefits } = site;

  return (
    <section id="benefits" className="py-24">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
              return (
              <GlassPanel key={benefit.title} className="flex flex-col gap-4 p-8">
                <Icon className="text-gold" />
                <span className="font-sans text-xs uppercase tracking-[0.18em] text-sage-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <DisplayHeading level="h3">{benefit.title}</DisplayHeading>
                <p className="font-sans text-sm text-cream">{benefit.body}</p>
                <a
                  href={benefit.href}
                  className="mt-auto inline-flex items-center gap-2 font-sans text-sm text-cream underline-offset-4 hover:underline"
                >
                  {benefit.linkLabel}
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </GlassPanel>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
