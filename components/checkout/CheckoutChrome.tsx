"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { site } from "@/content/site";
import { useCart } from "@/hooks/useCart";

// Checkout's own header and footer: the official crest home, a way back to the
// bag, and the legal links — no marketing navigation while paying.

export function CheckoutHeader() {
  const { openCart } = useCart();
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-290 items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        <Logo />
        {/* Opens the bag sheet over the checkout, so the form keeps its state. */}
        <button
          type="button"
          onClick={openCart}
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 font-sans text-base text-cream transition-colors duration-150 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to bag
        </button>
      </div>
    </header>
  );
}

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export function CheckoutFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-290 flex-col gap-3 px-4 py-6 font-sans text-sm text-sage-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-sm text-cream underline decoration-gold/50 underline-offset-4 transition-colors duration-150 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>
          &copy; {new Date().getFullYear()} {site.brand}
        </p>
      </div>
    </footer>
  );
}
