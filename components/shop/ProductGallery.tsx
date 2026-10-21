"use client";

import { useState } from "react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import type { ProductCategory } from "@/lib/catalog";

type Props = {
  name: string;
  category: ProductCategory;
  images: { src: string; alt: string }[];
  className?: string;
};

// Thumbnails appear only when a product has more than one real image; with no
// photography the labelled placeholder stands in on its own, in the same frame.
export function ProductGallery({ name, category, images, className }: Props) {
  const [active, setActive] = useState(0);
  const current = images.length > 0 ? images[Math.min(active, images.length - 1)] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <ProductVisual name={name} category={category} image={current} className={className} />
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-3" role="group" aria-label={`${name} images`}>
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={`aspect-square overflow-hidden rounded-card border bg-linen transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                index === active ? "border-gold" : "border-hairline hover:border-gold/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
