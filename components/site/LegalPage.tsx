import type { ReactNode } from "react";
import { Nav } from "@/components/site/Nav";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";

// Shared frame for /privacy and /terms: page header, a draft notice while
// business details are outstanding, then prose sections at a readable measure.

export const LEGAL_UPDATED = { iso: "2026-10-21", label: "21 October 2026" };

export function LegalPage({
  title,
  intro,
  draftNotice,
  children,
}: {
  title: string;
  intro: ReactNode;
  draftNotice: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <Nav variant="page" />
      <main className="flex-1 pt-28 pb-24 lg:pt-36 lg:pb-32">
        <Container>
          <article className="mx-auto flex max-w-[68ch] flex-col gap-10">
            <header className="flex flex-col gap-5">
              <Eyebrow withRule>Information</Eyebrow>
              <DisplayHeading level="h1" size="h2">
                {title}
              </DisplayHeading>
              <p className="font-sans text-sm text-sage-muted">
                Last updated <time dateTime={LEGAL_UPDATED.iso}>{LEGAL_UPDATED.label}</time>
              </p>
              <div
                role="note"
                className="rounded-card border border-gold/40 bg-forest-panel p-5 font-sans text-sm leading-relaxed text-cream"
              >
                {draftNotice}
              </div>
              <div className="font-sans text-base leading-relaxed text-cream">{intro}</div>
            </header>
            {children}
          </article>
        </Container>
      </main>
    </>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-28 flex-col gap-4">
      <h2 id={`${id}-title`} className="font-heading text-2xl leading-tight font-medium text-cream sm:text-[1.75rem]">
        {title}
      </h2>
      <div className="legal-prose flex flex-col gap-4 font-sans text-base leading-relaxed text-sage-muted">
        {children}
      </div>
    </section>
  );
}
