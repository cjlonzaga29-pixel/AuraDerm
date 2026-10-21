import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/site/Logo";
import { site } from "@/content/site";

// Section links are root-relative ("/#…") so they reach the homepage sections
// from every route; product pages have their own #ingredients anchor.
const EXPLORE_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Collection", href: "/#collection" },
  { label: "Ingredients", href: "/#ingredients" },
  { label: "Routine", href: "/#routine" },
  { label: "Our story", href: "/about" },
];

const INFORMATION_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  ...(site.commerce ? [{ label: "Shipping & Returns", href: "/shipping-returns" }] : []),
];

const linkClass =
  "rounded-sm font-sans text-sm text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-4">
      <h2 className="font-sans text-xs uppercase tracking-[0.18em] text-gold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Contact details and social links appear only once the owner supplies them
// (site.social); none are invented here.
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-glass-border"
      style={{ background: "color-mix(in srgb, var(--forest-deep) 92%, transparent)" }}
    >
      <Container className="flex flex-col gap-10 py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <div>
              <Logo variant="footer" />
            </div>
            <p className="max-w-[38ch] font-sans text-sm leading-relaxed text-sage-muted">
              {site.brand} — daily cleansing, conditioning and leave-on scalp care, with botanical
              ingredients selected for each step from scalp to strand.
            </p>
          </div>

          <LinkColumn title="Explore" links={EXPLORE_LINKS} />
          <LinkColumn title="Information" links={INFORMATION_LINKS} />

          {site.social.length > 0 ? (
            <LinkColumn title="Follow" links={site.social} />
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline pt-6">
          <p className="font-sans text-xs leading-relaxed text-sage-muted">{site.previewNotice}</p>
          <p className="font-sans text-xs text-sage-muted">
            &copy; {year} {site.brand}
          </p>
        </div>
      </Container>
    </footer>
  );
}
