"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavLink = { label: string; href: string };

// Built on the shadcn Sheet (Radix Dialog) for the focus trap, Escape-to-close
// and focus return to the toggle; only the visual treatment is customised to
// the smoked-glass system.
export function MenuToggle({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        data-testid="menu-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center rounded-full text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent
        id="mobile-menu-sheet"
        side="right"
        aria-describedby={undefined}
        className="glass-surface glass-veil w-[min(20rem,85vw)] gap-2 border-glass-border px-8 pt-24 text-cream [&>button]:text-cream [&>button]:focus:ring-ring [&>button]:focus:ring-offset-forest-deep [&>button>svg]:size-5"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <a
                href={link.href}
                className="rounded-card px-3 py-3 font-display text-3xl tracking-[0.02em] text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
