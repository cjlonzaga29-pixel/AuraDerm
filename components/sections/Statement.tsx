import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/content/site";

export function Statement() {
  const { statement } = site;

  return (
    <section className="flex min-h-[40vh] items-center justify-center py-24">
      <Reveal>
        <Container className="relative flex flex-col items-center gap-6 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at center, color-mix(in srgb, var(--forest-deep) 70%, transparent), transparent 75%)",
            }}
          />
          <DisplayHeading
            level="h2"
            accent={statement.accentWord}
            className="whitespace-pre-line"
          >
            {`${statement.line1}\n${statement.line2}`}
          </DisplayHeading>
          <p className="max-w-[56ch] font-sans text-base text-cream">{statement.subcopy}</p>
        </Container>
      </Reveal>
    </section>
  );
}
