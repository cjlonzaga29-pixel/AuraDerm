"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Checkout renders its own compact footer (components/checkout/CheckoutChrome),
// so the site footer steps aside there; every other route keeps it.
export function FooterGate({ children }: { children: ReactNode }) {
  return usePathname() === "/checkout" ? null : children;
}
