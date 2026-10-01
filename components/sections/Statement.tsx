import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Statement() {
  const { statement } = site;

  return (
    <section className="flex min-h-[40vh] items-center justify-center py-24">
      <Reveal>
        <Container className="flex flex-col items-center text-center">
          <div className="relative z-0 flex w-fit max-w-full flex-col items-center gap-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 rounded-4xl"
              style={{ background: "var(--glass-solid)" }}
            />
            <DisplayHeading
              level="h2"
              accent={statement.accentWord}
              className="whitespace-pre-line"
            >
              {`${statement.line1}\n${statement.line2}`}
            </DisplayHeading>
            <p className="max-w-[56ch] font-sans text-base text-cream">{statement.subcopy}</p>
          </div>
        </Container>
      </Reveal>
    </section>
  );
}
