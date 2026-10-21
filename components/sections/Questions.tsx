import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { site, type CheckoutMode, type HomeQuestion } from "@/content/site";

const LINK =
  "inline-flex min-h-11 items-center rounded-sm font-sans text-sm text-gold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function answerFor(item: HomeQuestion, mode: CheckoutMode): string {
  return typeof item.answer === "string" ? item.answer : item.answer[mode];
}

// Centered ~800px column on veil glass so the footage stays visible on both
// sides; hairline dividers between questions. The checkout answer follows
// the server-resolved mode passed in by the page.
export function Questions({ checkoutMode }: { checkoutMode: CheckoutMode }) {
  const { questions } = site;

  return (
    <section id="questions" aria-labelledby="questions-heading" className="py-8 lg:py-12">
      <Container>
        <GlassPanel tone="veil" className="mx-auto flex max-w-200 flex-col gap-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-3 text-center">
            <h2
              id="questions-heading"
              className="font-heading text-[clamp(2.25rem,4vw,3rem)] leading-[1.05] font-medium tracking-[-0.02em] text-cream"
            >
              {questions.headline}
            </h2>
            <p className="font-sans text-sm leading-relaxed text-sage-muted">{questions.note}</p>
          </div>

          <Accordion type="multiple" className="border-y border-hairline" data-testid="home-questions">
            {questions.items.map((item, i) => (
              <AccordionItem key={item.question} value={`q${i}`}>
                <AccordionTrigger className="min-h-14 text-lg">{item.question}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 text-base">
                  <p className="text-cream">{answerFor(item, checkoutMode)}</p>
                  {item.links?.length ? (
                    <ul className="flex flex-wrap gap-x-5 gap-y-1">
                      {item.links.map((link) => (
                        <li key={link.href}>
                          {link.href.startsWith("#") ? (
                            <a href={link.href} className={LINK}>
                              {link.label}
                            </a>
                          ) : (
                            <Link href={link.href} className={LINK}>
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </GlassPanel>
      </Container>
    </section>
  );
}
