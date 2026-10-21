"use client";

import { useState } from "react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import type { CatalogImage, ProductCategory } from "@/lib/catalog";

type Props = {
  name: string;
  category: ProductCategory;
  images: CatalogImage[];
  className?: string;
};

// Thumbnails appear only when a product has more than one image; with none the
// labelled placeholder stands in on its own, in the same frame. Every view is
// shown contained so combined 16:9 front/back images are never cropped.
export function ProductGallery({ name, category, images, className }: Props) {
  const [active, setActive] = useState(0);
  const current = images.length > 0 ? images[Math.min(active, images.length - 1)] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <ProductVisual name={name} category={category} image={current} priority className={className} />
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-3" role="group" aria-label={`${name} images`}>
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Show image ${index + 1} of ${images.length}: ${image.alt}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={`aspect-square overflow-hidden rounded-card border-2 bg-forest-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                index === active ? "border-gold" : "border-hairline hover:border-gold/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
