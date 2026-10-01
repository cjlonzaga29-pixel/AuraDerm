import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";
import { RoutineVesselIllustration } from "@/components/illustrations";

function StepIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-gold"
    >
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Routine() {
  const { routine, routineIntro } = site;

  return (
    <section id="routine" className="py-24">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-6">
            <GlassPanel className="flex flex-col gap-6 p-8 lg:p-12">
              <Eyebrow>{routineIntro.eyebrow}</Eyebrow>
              <DisplayHeading level="h2" className="whitespace-pre-line">
                {routineIntro.headline}
              </DisplayHeading>
              <p className="font-sans text-sm text-cream">{routineIntro.body}</p>
              <div className="flex flex-col gap-4">
                {routine.map((step) => (
                  <div key={step.slot} className="flex items-center gap-3">
                    <StepIcon />
                    <span className="font-sans text-sm text-cream">{step.title}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-8 p-8 lg:p-12">
              <div className="flex h-40 items-center justify-center rounded-card border border-glass-border bg-glass-solid">
                <RoutineVesselIllustration
                  title="Illustrative skincare vessel concept"
                  className="h-28 w-28"
                />
              </div>

              <ol className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-4">
                {routine.map((step, index) => (
                  <li key={step.slot} className="flex gap-4 lg:flex-1 lg:flex-col lg:gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold bg-forest-deep font-sans text-xs text-cream">
                        {index + 1}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mt-1 w-px flex-1 bg-glass-border lg:mt-2 lg:h-px lg:w-full lg:flex-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 rounded-card border border-glass-border bg-glass-solid p-4">
                      <span className="font-sans text-xs uppercase tracking-[0.18em] text-gold">
                        {step.slot}
                      </span>
                      <span className="font-display text-base text-cream">{step.title}</span>
                      <span className="font-sans text-sm text-sage-muted">{step.body}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </GlassPanel>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
