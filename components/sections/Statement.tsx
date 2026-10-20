import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { site } from "@/content/site";

// Brand statement with the three former benefit cards folded in as a quiet
// hairline-ruled list — one message, said once, with no boxes.
export function Statement() {
  const { statement, benefits } = site;

  return (
    <section id="statement" className="py-24 lg:py-36">
      <Container>
        <div className="text-scrim flex max-w-xl flex-col gap-10 lg:max-w-120">
          <div className="flex flex-col gap-5">
            <DisplayHeading level="h2" accent={statement.accentWord} className="whitespace-pre-line lg:w-max">
              {statement.headline}
            </DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream">{statement.subcopy}</p>
          </div>

          <ul className="flex flex-col">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex flex-col gap-1 border-t border-hairline py-4">
                <h3 className="font-sans text-base font-medium text-cream">{benefit.title}</h3>
                <p className="font-sans text-sm leading-relaxed text-sage-muted">{benefit.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
