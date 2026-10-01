"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MenuToggle } from "@/components/site/MenuToggle";
import { site } from "@/content/site";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { label: "Rituals", href: "#routine" },
  { label: "Ingredients", href: "#ingredients" },
  { label: "Science", href: "#actives" },
  { label: "Our story", href: "/about" },
];

export function Nav() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-4 z-50">
      <Container>
        <div className="flex items-center justify-between rounded-pill border border-glass-border bg-surface-nav px-5 py-2.5 md:backdrop-blur-[12px]">
          <Link href="/" className="flex flex-col leading-none">
            {/* [CONTENT: vector logo] — text lockup placeholder */}
            <span className="font-display text-lg text-gold">AURADERM</span>
            <span className="font-sans text-[0.625rem] uppercase tracking-[0.24em] text-cream">
              Botanicals
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
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
            <MenuToggle links={NAV_LINKS} />
          </div>
        </div>
      </Container>
    </header>
  );
}
