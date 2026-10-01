"use client";

import { useEffect, useRef, useState } from "react";

type NavLink = { label: string; href: string };

export function MenuToggle({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      buttonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        data-testid="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu-sheet"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center text-cream lg:hidden"
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>

      {open ? (
        <div
          id="mobile-menu-sheet"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-surface-nav"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-display text-2xl text-cream"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </>
  );
}
