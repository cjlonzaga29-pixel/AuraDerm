import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Our story · AuraDerm Botanicals",
};

// Interim page: restates only existing site copy until the owner supplies
// the brand story. No history, founders or claims are invented here.
export default function AboutPage() {
  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-28 pb-24 lg:pt-36 lg:pb-32">
        <Container>
          <div className="mx-auto flex max-w-[68ch] flex-col gap-6">
            <Eyebrow withRule>Our story</Eyebrow>
            <DisplayHeading level="h1" size="h2" accent="strand.">
              {site.editorial.headline}
            </DisplayHeading>
            <p className="font-sans text-base leading-relaxed text-cream">
              {site.brand} brings together daily cleansing, conditioning and leave-on scalp care, with
              ingredients selected for each step. {site.hero.subcopy}
            </p>
            <p className="font-sans text-sm leading-relaxed text-sage-muted">
              The full brand story is coming soon.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild variant="primary" size="cta">
                <Link href="/shop">Visit the shop</Link>
              </Button>
              <Button asChild variant="outline" size="cta">
                <Link href="/#routine">Explore the routine</Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
