import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { MediaSlot } from "@/components/ui/MediaSlot";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

// Alternating image/text: a wide landscape on the left, copy on the right set
// on the footage with a feathered scrim rather than a card. Stacks image-first
// below lg.
export function Editorial() {
  const { editorial } = site;

  return (
    <section id="care" className="py-8 lg:py-12">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <MediaSlot slot={editorial.media} />
          <div className="text-scrim flex flex-col items-start gap-5">
            <DisplayHeading level="h2" accent={editorial.accentWord}>
              {editorial.headline}
            </DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream lg:text-lg">
              {editorial.body}
            </p>
            <Button variant="text" size="inline" href={editorial.cta.href}>
              {editorial.cta.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
