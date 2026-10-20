import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { site } from "@/content/site";

// Three numbered steps set straight on the footage with a feathered scrim —
// typographic, so it reads differently from the two glass panels above.
export function Routine() {
  const { routine, routineIntro } = site;

  return (
    <section id="routine" className="py-24 lg:py-36">
      <Container>
        <div className="text-scrim flex max-w-xl flex-col gap-8 lg:max-w-120">
          <div className="flex flex-col gap-3">
            <DisplayHeading level="h2">{routineIntro.headline}</DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream">{routineIntro.body}</p>
          </div>

          <ol className="flex flex-col">
            {routine.map((step, index) => (
              <li key={step.title} className="flex gap-5 border-t border-hairline py-5">
                <span className="w-6 shrink-0 font-sans text-sm text-sage-muted tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sans text-base font-medium text-cream">{step.title}</h3>
                  <p className="font-sans text-sm leading-relaxed text-sage-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
