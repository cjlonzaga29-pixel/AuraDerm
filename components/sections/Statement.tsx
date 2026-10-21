import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { site } from "@/content/site";

// Open brand statement: large, centred and unboxed — only the feathered scrim
// behind the words, with the scenery left visible around them.
export function Statement() {
  const { statement } = site;

  return (
    <section id="statement" className="py-12 lg:py-20">
      <Container>
        <div className="text-scrim mx-auto w-fit max-w-full text-center">
          <DisplayHeading
            level="h2"
            size="display"
            accent={statement.accentWord}
            className="whitespace-pre-line"
          >
            {statement.headline}
          </DisplayHeading>
        </div>
      </Container>
    </section>
  );
}
