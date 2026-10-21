import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { site } from "@/content/site";

// Image left, three numbered steps right (each naming and linking its
// product), divided by fine rules rather than cards. The steps sit on veil
// glass because the column crosses the bottle label in the footage. Stacks
// image-first below lg.
export function Routine() {
  const { routine, routineIntro } = site;

  return (
    <section id="routine" className="py-8 lg:py-12">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <MediaSlot slot={routineIntro.media} />

          <GlassPanel tone="veil" className="flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-3">
              <DisplayHeading level="h2">{routineIntro.headline}</DisplayHeading>
              <p className="font-sans text-base leading-relaxed text-cream">{routineIntro.body}</p>
            </div>

            <ol className="flex flex-col border-b border-hairline">
              {routine.map((step, index) => (
                <li key={step.title} className="flex gap-5 border-t border-hairline py-5">
                  <span className="w-10 shrink-0 font-heading text-3xl leading-none text-gold tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-lg font-medium text-cream">{step.title}</h3>
                    <p className="font-sans text-base leading-relaxed text-sage-muted">
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
          </GlassPanel>
        </div>
      </Container>
    </section>
  );
}
