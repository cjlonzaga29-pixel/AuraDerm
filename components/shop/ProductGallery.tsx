"use client";

import { useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CatalogImage, ProductCategory } from "@/lib/catalog";

type Props = {
  name: string;
  category: ProductCategory;
  images: CatalogImage[];
  className?: string;
};

const SWIPE_THRESHOLD = 40;

const VIEW_LABELS: Record<NonNullable<CatalogImage["view"]>, string> = {
  front: "Front",
  back: "Back",
  styled: "Styled",
  "front-back": "Front and back",
};

const controlClass =
  "flex size-10 items-center justify-center rounded-full border border-glass-border bg-forest-deep/80 text-cream transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Product gallery. Front view first (ordered by the catalog). Navigation —
// thumbnails, previous/next and swipe — only appears with more than one image;
// a single image still opens in the enlarge dialog. Every view is shown
// contained at its native ratio, so tall bottles and 16:9 front/back images
// are never cropped.
export function ProductGallery({ name, category, images, className }: Props) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = images.length;
  const multiple = count > 1;
  const index = count > 0 ? Math.min(active, count - 1) : 0;
  const current = count > 0 ? images[index] : undefined;

  const go = (delta: number) => setActive((i) => (i + delta + count) % count);

  const swipe = {
    onTouchStart: (event: TouchEvent) => {
      touchStart.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      const end = event.changedTouches[0]?.clientX;
      if (!multiple || start === null || end === undefined) return;
      if (Math.abs(end - start) >= SWIPE_THRESHOLD) go(end < start ? 1 : -1);
    },
  };

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
      <div className="relative" {...swipe}>
        <ProductVisual name={name} category={category} image={current} priority className={className} />

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
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.src}
                  alt={current.alt}
                  width={current.width}
                  height={current.height}
                  className="max-h-[calc(100dvh-7rem)] w-auto max-w-full object-contain"
                />
                {current.illustrative ? (
                  <span className="absolute bottom-2 left-2 rounded-full border border-glass-border bg-forest-deep/85 px-2.5 py-1 font-sans text-xs text-cream">
                    Illustrative packaging
                  </span>
                ) : null}
              </div>
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
        <div className="grid grid-cols-5 gap-3" role="group" aria-label={`${name} images`}>
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Show image ${i + 1} of ${count}${image.view ? ` (${VIEW_LABELS[image.view]} view)` : ""}: ${image.alt}`}
              aria-pressed={i === index}
              onClick={() => setActive(i)}
              className={cn(
                "aspect-square overflow-hidden rounded-card border-2 bg-forest-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === index ? "border-gold" : "border-hairline hover:border-gold/50",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" className="size-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
