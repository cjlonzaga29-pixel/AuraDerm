import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";

const NAV_LINKS = [
  { label: "Rituals", href: "/#routine" },
  { label: "Ingredients", href: "/#ingredients" },
  { label: "Science", href: "/#actives" },
  { label: "Our story", href: "/about" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-glass-border"
      style={{ background: "color-mix(in srgb, var(--forest-deep) 92%, transparent)" }}
    >
      <Container className="flex flex-col gap-10 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg text-gold">AURADERM</span>
            <span className="font-sans text-[0.625rem] uppercase tracking-[0.24em] text-sage-muted">
              Botanicals
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-4" aria-label="Footer">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-wrap gap-x-8 gap-y-4" aria-label="Legal">
            <Link
              href="/privacy"
              className="font-sans text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:text-gold"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-sans text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:text-gold"
            >
              Terms
            </Link>
            {site.commerce ? (
              <Link
                href="/shipping-returns"
                className="font-sans text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:text-gold"
              >
                Shipping & Returns
              </Link>
            ) : null}
          </nav>

          {site.social.length > 0 ? (
            <nav className="flex flex-wrap gap-x-6 gap-y-4" aria-label="Social">
              {site.social.map((entry) => (
                <a
                  key={entry.href}
                  href={entry.href}
                  className="font-sans text-xs uppercase tracking-[0.18em] text-cream transition-colors hover:text-gold"
                >
                  {entry.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>

        <p className="font-sans text-xs text-sage-muted">
          &copy; {year} AuraDerm Botanicals
        </p>
      </Container>
    </footer>
  );
}
