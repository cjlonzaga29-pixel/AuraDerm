"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ProductTab = { id: string; label: string; content: ReactNode };

// The URL hash is the selection: #ingredients, #how-to-use, #cautions… select
// their tab on load, from in-page links (Q&A answers, the highlights link),
// from other pages and on back/forward. No hash, or one that names no tab,
// means the first tab. Clicking a tab pushes its hash without a jump;
// arrowing through tabs replaces it so history is not flooded.
//
// The hash ids sit on the tab buttons, not the panels: every anchor exists in
// the server HTML, and the browser's own fragment scroll lands on the tab
// list (below the fixed header via scroll-padding) and reveals the tab inside
// the horizontally scrolling list. Only the selected panel is mounted, so
// inactive content is neither duplicated nor focusable.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

const readHash = () => window.location.hash.slice(1);

export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const selected = tabs.some((tab) => tab.id === hash) ? hash : (tabs[0]?.id ?? "");
  const listRef = useRef<HTMLDivElement>(null);
  const viaKeyboard = useRef(false);
  const [more, setMore] = useState({ before: false, after: false });

  const select = (id: string) => {
    if (window.location.hash !== `#${id}`) {
      if (viaKeyboard.current) window.history.replaceState(null, "", `#${id}`);
      else window.history.pushState(null, "", `#${id}`);
    }
    listeners.forEach((listener) => listener());
  };

  // Fades mark more tabs beyond either edge of the scrolling list.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const max = list.scrollWidth - list.clientWidth;
      setMore({ before: list.scrollLeft > 1, after: list.scrollLeft < max - 1 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, []);

  // Keep the selected tab inside the list's own scroll area; never scrolls the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = selected ? document.getElementById(selected) : null;
    if (!list || !tab || !list.contains(tab)) return;
    const left = tab.offsetLeft - list.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < list.scrollLeft) list.scrollTo({ left: Math.max(0, left - 24) });
    else if (right > list.scrollLeft + list.clientWidth) list.scrollTo({ left: right - list.clientWidth + 24 });
  }, [selected]);

  if (tabs.length === 0) return null;

  return (
    <Tabs value={selected} onValueChange={select} data-testid="product-details">
      <div className="relative">
        <TabsList
          ref={listRef}
          aria-label="Product details"
          className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDownCapture={() => {
            viaKeyboard.current = true;
          }}
          onPointerDownCapture={() => {
            viaKeyboard.current = false;
          }}
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} id={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-0 bottom-px left-0 flex w-10 items-center bg-gradient-to-r from-forest-deep to-transparent text-gold transition-opacity",
            more.before ? "opacity-100" : "opacity-0",
          )}
        >
          <ChevronLeft className="size-4" />
        </div>
        <div
          aria-hidden="true"
          data-testid="tabs-more"
          className={cn(
            "pointer-events-none absolute top-0 right-0 bottom-px flex w-10 items-center justify-end bg-gradient-to-l from-forest-deep to-transparent text-gold transition-opacity",
            more.after ? "opacity-100" : "opacity-0",
          )}
        >
          <ChevronRight className="size-4" />
        </div>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} aria-labelledby={tab.id}>
          <h2 className="sr-only">{tab.label}</h2>
          <div className="font-sans text-base leading-relaxed text-sage-muted">{tab.content}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
