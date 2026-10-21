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
  { label: "Routine", href: "#routine" },
];

const SHOP_LINK = { label: "Shop", href: "/shop" };

const STORY_LINK = { label: "Our story", href: "/about" };

// Slim transparent header: no pill or border, only the .site-header fade for
// contrast at the top of the frame. Three section links plus one understated
// outline CTA; below lg the shadcn Sheet carries the same links.
// variant="page" (shop routes) keeps the header solid, points the section
// links back at the homepage and always shows the bag; on the homepage the bag
// appears only once something is in it, independent of site.commerce.
export function Nav({ variant = "home" }: { variant?: "home" | "page" }) {
  const { itemCount, openCart } = useCart();
  const onHome = variant === "home";
  const links = [
    ...NAV_LINKS.map((link) => (onHome ? link : { ...link, href: `/${link.href}` })),
    SHOP_LINK,
  ];
  const showBag = !onHome || itemCount > 0;
  // Over the hero the header is only a fade; once content scrolls beneath it,
  // it gains a smoked surface so section copy never collides with the links.
  const [scrolledPast, setScrolled] = useState(false);
  const scrolled = scrolledPast || !onHome;

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
            {links.map((link) => (
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
              </div>
            ) : null}
            {showBag || site.commerce ? (
              <button
                type="button"
                aria-label={itemCount > 0 ? `Open bag, ${itemCount} items` : "Open bag"}
                data-testid="bag-button"
                onClick={openCart}
                className="relative flex size-10 items-center justify-center rounded-full text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShoppingBag className="size-5" aria-hidden="true" />
                {itemCount > 0 ? (
                  <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-gold text-[0.625rem] font-medium text-forest-deep">
                    {itemCount}
                  </span>
                ) : null}
              </button>
            ) : null}
            <Button
              variant="quiet"
              size="sm"
              href={STORY_LINK.href}
              className="hidden h-9 rounded-full border-cream/40 px-4 text-sm lg:inline-flex"
            >
              {STORY_LINK.label}
            </Button>
            <MenuToggle links={[...links, STORY_LINK]} />
          </div>
        </div>
      </Container>
    </header>
  );
}
