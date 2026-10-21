"use client";

import { useState } from "react";
import { ProductVisual } from "@/components/shop/ProductVisual";
import type { ConceptVisual } from "@/lib/catalog";

type Props = {
  name: string;
  concept: ConceptVisual;
  images: { src: string; alt: string }[];
};

// Thumbnails appear only when a product has more than one real image; with no
// photography the labelled concept illustration stands in on its own.
export function ProductGallery({ name, concept, images }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <ProductVisual concept={concept} name={name} />;
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-card border border-hairline bg-forest">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.alt} className="size-full object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-3" role="group" aria-label={`${name} images`}>
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={`aspect-square overflow-hidden rounded-card border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
