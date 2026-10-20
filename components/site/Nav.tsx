"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MenuToggle } from "@/components/site/MenuToggle";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { label: "Collection", href: "#collection" },
  { label: "Ingredients", href: "#ingredients" },
  { label: "Ritual", href: "#routine" },
];

const STORY_LINK = { label: "Our story", href: "/about" };

// Slim transparent header: no pill or border, only the .site-header fade for
// contrast at the top of the frame. Three section links plus one understated
// outline CTA; below lg the shadcn Sheet carries the same links.
export function Nav() {
  const { itemCount, openCart } = useCart();
  // Over the hero the header is only a fade; once content scrolls beneath it,
  // it gains a smoked surface so section copy never collides with the links.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "true" : "false"}
      className={`site-header fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-hairline bg-forest-deep/90 md:bg-surface-nav md:backdrop-blur-[14px]"
          : "border-transparent"
      }`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-6 lg:h-20">
          <Link href="/" className="flex flex-col leading-none">
            {/* [CONTENT: vector logo] — text lockup placeholder */}
            <span className="font-display text-lg text-gold">AURADERM</span>
            <span className="font-sans text-[0.625rem] uppercase tracking-[0.24em] text-cream">
              Botanicals
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-sm font-sans text-sm text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {site.commerce ? (
              <div className="hidden items-center gap-4 lg:flex" aria-label="Account actions">
                <button type="button" aria-label="Search" className="text-cream">
                  Search
                </button>
                <button type="button" aria-label="Account" className="text-cream">
                  Account
                </button>
                <button
                  type="button"
                  aria-label="Cart"
                  onClick={openCart}
                  className="relative text-cream transition-colors hover:text-gold"
                >
                  <ShoppingBag className="size-5" aria-hidden="true" />
                  {itemCount > 0 ? (
                    <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-gold text-[0.625rem] font-medium text-forest-deep">
                      {itemCount}
                    </span>
                  ) : null}
                </button>
              </div>
            ) : null}
            <Button
              variant="quiet"
              size="sm"
              href={STORY_LINK.href}
              className="hidden h-9 rounded-full border-cream/40 px-4 text-sm lg:inline-flex"
            >
              {STORY_LINK.label}
            </Button>
            <MenuToggle links={[...NAV_LINKS, STORY_LINK]} />
          </div>
        </div>
      </Container>
    </header>
  );
}
