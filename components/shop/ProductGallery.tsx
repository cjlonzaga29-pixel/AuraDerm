"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { containedRect, magnify, zoomFor, type MagnifierView, type Rect } from "@/lib/magnifier";
import type { CatalogImage, ProductCategory } from "@/lib/catalog";

type Props = {
  name: string;
  category: ProductCategory;
  images: CatalogImage[];
  className?: string;
};

const SWIPE_THRESHOLD = 40;
/** A touch that travelled this far was a swipe or a scroll, not a tap. */
const TAP_SLOP = 10;

// The hover preview needs a mouse and room beside the gallery (the two-column
// layout from lg). Touch, pen and narrower screens use tap-to-enlarge instead.
export const HOVER_ZOOM_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 64rem)";
/** Gap between the gallery and the preview when the bounds set no column gap. */
const PREVIEW_GAP = 40;

type Hover = MagnifierView & {
  src: string;
  /** Preview box, relative to the image wrapper. */
  preview: Rect;
  /** The img element's offset inside the wrapper. */
  origin: { x: number; y: number };
};

const VIEW_LABELS: Record<NonNullable<CatalogImage["view"]>, string> = {
  front: "Front",
  back: "Back",
  styled: "Styled",
  "front-back": "Front and back",
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Brings a thumbnail fully into its strip without scrolling the page, as
// scrollIntoView would.
function revealThumb(thumb: HTMLElement, behavior: ScrollBehavior) {
  const strip = thumb.parentElement;
  if (!strip) return;
  const pad = 4;
  const left = thumb.offsetLeft - pad;
  const right = thumb.offsetLeft + thumb.offsetWidth + pad;
  if (left < strip.scrollLeft) strip.scrollTo({ left, behavior });
  else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: right - strip.clientWidth, behavior });
}

const controlClass =
  "flex size-10 items-center justify-center rounded-full border border-glass-border bg-forest-deep/80 text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Product gallery. Front view first (ordered by the catalog). Navigation —
// thumbnails, previous/next and swipe — only appears with more than one image;
// thumbnails sit in one horizontally scrolling row whose own arrows only move
// the row, never the selection, and only appear once the row overflows;
// a single image still opens in the enlarge dialog. Every view is shown
// contained at its native ratio, so tall bottles and 16:9 front/back images
// are never cropped.
//
// With a mouse on wide screens, hovering the painted image (not its letterbox
// padding) shows a ~2× preview beside the gallery, laid over the product copy
// without moving it or taking clicks. Leaving the image, scrolling, resizing,
// switching image or opening the dialog dismisses it. Clicking or tapping the
// image, or the Enlarge button, opens the dialog: the keyboard and touch route
// to the same close look.
export function ProductGallery({ name, category, images, className }: Props) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [hover, setHover] = useState<Hover | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [strip, setStrip] = useState({ overflow: false, atStart: true, atEnd: true });
  const count = images.length;
  const multiple = count > 1;
  const index = count > 0 ? Math.min(active, count - 1) : 0;
  const current = count > 0 ? images[index] : undefined;

  const go = (delta: number) => setActive((i) => (i + delta + count) % count);

  const swipe = {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      const end = event.changedTouches[0];
      if (start === null || end === undefined) return;
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      // A touch that moved never doubles as tap-to-enlarge.
      if (Math.hypot(dx, dy) > TAP_SLOP) suppressClickUntil.current = Date.now() + 500;
      if (multiple && Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    },
  };

  // Thumbnail strip: measured after mount, so the server render (and no-JS)
  // shows a plain scrollable row with no arrows.
  const measureStrip = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { overflow: max > 1, atStart: el.scrollLeft <= 1, atEnd: el.scrollLeft >= max - 1 };
    setStrip((prev) =>
      prev.overflow === next.overflow && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
    );
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    measureStrip();
    const observer = new ResizeObserver(measureStrip);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureStrip, count]);

  const scrollStrip = (direction: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  // Main-image navigation (arrows, swipe, dialog keys) keeps its thumbnail in view.
  useEffect(() => {
    const thumb = stripRef.current?.children[index];
    if (thumb instanceof HTMLElement) revealThumb(thumb, prefersReducedMotion() ? "auto" : "smooth");
  }, [index]);

  // The preview only lives while the pointer rests on the image: a scroll or
  // resize moves the image under it, so dismiss and let the next pointer move
  // rebuild it from fresh geometry.
  const hovering = hover !== null;
  useEffect(() => {
    if (!hovering) return;
    const dismiss = () => setHover(null);
    window.addEventListener("scroll", dismiss, { passive: true, capture: true });
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, { capture: true });
      window.removeEventListener("resize", dismiss);
    };
  }, [hovering]);

  const track = (event: PointerEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const wrapper = wrapperRef.current;
    if (
      event.pointerType !== "mouse" ||
      !wrapper ||
      !current ||
      zoomOpen ||
      !window.matchMedia(HOVER_ZOOM_QUERY).matches
    ) {
      setHover(null);
      return;
    }
    const box = img.getBoundingClientRect();
    const natural = { width: img.naturalWidth, height: img.naturalHeight };
    const content = containedRect(box, natural);
    const zoom = zoomFor(content, natural);
    if (zoom === null) {
      setHover(null);
      return;
    }
    // As large as the painted image, but never past the area the page marks
    // as available beside the gallery.
    // The preview sits across the page's own column gap, so it starts where
    // the purchase column does.
    const outer = wrapper.getBoundingClientRect();
    const boundsEl = wrapper.closest("[data-magnifier-bounds]");
    const bounds = boundsEl?.getBoundingClientRect();
    const right = bounds ? bounds.right : document.documentElement.clientWidth;
    const gap = (boundsEl && parseFloat(getComputedStyle(boundsEl).columnGap)) || PREVIEW_GAP;
    const preview = {
      left: outer.width + gap,
      top: box.top - outer.top + content.top,
      width: Math.min(content.width, right - outer.right - gap),
      height: content.height,
    };
    const view =
      preview.width > 0
        ? magnify({ x: event.clientX - box.left, y: event.clientY - box.top }, content, zoom, preview)
        : null;
    setHover(
      view
        ? { ...view, src: current.src, preview, origin: { x: box.left - outer.left, y: box.top - outer.top } }
        : null,
    );
  };

  const imageProps = {
    onPointerEnter: track,
    onPointerMove: track,
    onPointerLeave: () => setHover(null),
    onClick: () => {
      if (Date.now() < suppressClickUntil.current) return;
      setHover(null);
      setZoomOpen(true);
    },
    draggable: false,
    className: "cursor-zoom-in",
  };
  // Stale geometry never outlives its image or the dialog opening.
  const view = hover && current && hover.src === current.src && !zoomOpen ? hover : null;

  const onZoomKeyDown = (event: KeyboardEvent) => {
    if (!multiple) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  };

  const position = `Image ${index + 1} of ${count}`;
  const viewLabel = current?.view ? VIEW_LABELS[current.view] : null;

  if (!current) {
    return <ProductVisual name={name} category={category} className={className} />;
  }

  return (
    <div className="flex flex-col gap-3" data-testid="product-gallery">
      <div ref={wrapperRef} className="relative" {...swipe}>
        <ProductVisual
          name={name}
          category={category}
          image={current}
          priority
          className={className}
          imageProps={imageProps}
        />

        {view ? (
          <>
            {/* The lens outlines the area shown in the preview. */}
            <div
              aria-hidden="true"
              data-testid="magnifier-lens"
              className="pointer-events-none absolute border border-gold bg-cream/15"
              style={{
                left: view.origin.x + view.lens.left,
                top: view.origin.y + view.lens.top,
                width: view.lens.width,
                height: view.lens.height,
              }}
            />
            <div
              aria-hidden="true"
              data-testid="magnifier-preview"
              className="pointer-events-none absolute z-30 overflow-hidden rounded-card border border-hairline bg-linen shadow-2xl"
              style={{
                left: view.preview.left,
                top: view.preview.top,
                width: view.preview.width,
                height: view.preview.height,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={view.src}
                alt=""
                draggable={false}
                className="absolute top-0 left-0 max-w-none"
                style={{
                  width: view.image.width,
                  height: view.image.height,
                  transform: `translate3d(${view.offset.x}px, ${view.offset.y}px, 0)`,
                }}
              />
            </div>
          </>
        ) : null}

        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Enlarge image: ${current.alt}`}
              className={cn(controlClass, "absolute top-3 right-3")}
            >
              <Expand className="size-4" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent
            onKeyDown={onZoomKeyDown}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] gap-3 border-hairline bg-forest-deep p-3 text-cream sm:max-w-4xl sm:p-4 [&>button:last-child]:text-cream"
            data-testid="gallery-dialog"
          >
            <DialogTitle className="sr-only">
              {name}
              {multiple ? ` — ${position}` : ""}
            </DialogTitle>
            <DialogDescription className="sr-only">{current.alt}</DialogDescription>
            <div className="flex items-center justify-center" {...swipe}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                className="max-h-[calc(100dvh-7rem)] w-auto max-w-full object-contain"
              />
            </div>
            {multiple ? (
              <div className="flex items-center justify-between gap-3">
                <button type="button" aria-label="Previous image" onClick={() => go(-1)} className={controlClass}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <p className="font-sans text-sm text-sage-muted" aria-live="polite">
                  {viewLabel ? `${viewLabel} · ` : ""}
                  {position}
                </p>
                <button type="button" aria-label="Next image" onClick={() => go(1)} className={controlClass}>
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {multiple ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className={cn(controlClass, "absolute top-1/2 left-3 -translate-y-1/2")}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className={cn(controlClass, "absolute top-1/2 right-3 -translate-y-1/2")}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <p className="sr-only" aria-live="polite">
              {viewLabel ? `${viewLabel} view, ` : ""}
              {position}
            </p>
          </>
        ) : null}
      </div>

      {multiple ? (
        <div className="flex items-center gap-1" data-testid="thumbnail-strip">
          {strip.overflow ? (
            <Button
              type="button"
              variant="quiet"
              aria-label="Scroll thumbnails left"
              disabled={strip.atStart}
              onClick={() => scrollStrip(-1)}
              className="size-11 shrink-0 p-0"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          <div
            ref={stripRef}
            onScroll={measureStrip}
            className="relative flex min-w-0 flex-1 touch-pan-x scroll-px-1 gap-2 overflow-x-auto overscroll-x-contain p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={`${name} images`}
          >
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Show image ${i + 1} of ${count}${image.view ? ` (${VIEW_LABELS[image.view]} view)` : ""}: ${image.alt}`}
                aria-pressed={i === index}
                onClick={() => setActive(i)}
                onFocus={(event) => revealThumb(event.currentTarget, "auto")}
                className={cn(
                  "size-16 shrink-0 overflow-hidden rounded-card border-2 bg-linen transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-[4.5rem]",
                  i === index ? "border-gold ring-1 ring-gold/60" : "border-hairline opacity-80 hover:border-gold/50 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt="" className="size-full object-contain" loading="lazy" draggable={false} />
              </button>
            ))}
          </div>
          {strip.overflow ? (
            <Button
              type="button"
              variant="quiet"
              aria-label="Scroll thumbnails right"
              disabled={strip.atEnd}
              onClick={() => scrollStrip(1)}
              className="size-11 shrink-0 p-0"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
