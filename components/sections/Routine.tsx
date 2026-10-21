import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { site } from "@/content/site";

// P4-P23: one shared glass card holds the image and the steps. At lg the two
// sit in equal columns and the steps are set compactly enough to match the
// image's natural 4:3 height; if the copy needs more room the card simply
// grows. Below lg the image stacks above the steps inside the same card.
export function Routine() {
  const { routine, routineIntro } = site;

  return (
    <section id="routine" className="py-8 lg:py-12">
      <Container>
        <GlassPanel
          tone="veil"
          className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2 lg:items-start"
        >
          <MediaSlot slot={routineIntro.media} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <DisplayHeading level="h2" size="h3" className="sm:text-[1.75rem] lg:text-[2rem]">
                {routineIntro.headline}
              </DisplayHeading>
              <p className="font-sans text-base leading-relaxed text-cream">{routineIntro.body}</p>
            </div>

            <ol className="flex flex-col">
              {routine.map((step, index) => (
                <li key={step.title} className="flex gap-4 border-t border-hairline py-3 last:pb-0">
                  <span className="w-8 shrink-0 font-heading text-2xl leading-none text-gold tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-sans text-base font-medium leading-snug text-cream">{step.title}</h3>
                    <p className="font-sans text-base leading-normal text-pretty text-sage-muted">
                      {step.body.map((segment, i) =>
                        typeof segment === "string" ? (
                          segment
                        ) : (
                          <Link
                            key={i}
                            href={`/shop/${segment.slug}`}
                            className="text-cream underline underline-offset-4 hover:text-gold"
                          >
                            {segment.label}
                          </Link>
                        ),
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </GlassPanel>
      </Container>
    </section>
  );
}
