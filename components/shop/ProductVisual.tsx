import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { CatalogImage, ProductCategory } from "@/lib/catalog";

type Props = {
  name: string;
  category: ProductCategory;
  /** Approved image; when present it takes the same frame. */
  image?: CatalogImage;
  /** "contain" (default) keeps the whole bottle in frame; "cover" fills it. */
  fit?: "cover" | "contain";
  /** Eager-load images that are visible on first paint. */
  priority?: boolean;
  className?: string;
  /** Extra props for the <img> (ref, pointer handlers) used by the gallery. */
  imageProps?: Omit<ComponentProps<"img">, "src" | "alt" | "width" | "height">;
};

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Small category marks — a lather drop, combed strands, a dropper. Deliberately
// abstract: no bottle outlines or labels that could pass for packaging.
function CategoryMark({ category }: { category: ProductCategory }) {
  return (
    <svg viewBox="0 0 48 48" className="size-12 sm:size-14" aria-hidden="true">
      {category === "Shampoo" ? (
        <g {...LINE}>
          <path d="M24 9c-6 8-10 13.5-10 18.5a10 10 0 0 0 20 0C34 22.5 30 17 24 9Z" />
          <circle cx="36" cy="13" r="2.5" />
          <circle cx="40" cy="20" r="1.5" />
          <circle cx="10" cy="17" r="2" />
        </g>
      ) : category === "Conditioner" ? (
        <g {...LINE}>
          <path d="M14 8c-3 8 5 12 2 20s4 12 2 12" />
          <path d="M22 8c-3 8 5 12 2 20s4 12 2 12" />
          <path d="M30 8c-3 8 5 12 2 20s4 12 2 12" />
        </g>
      ) : (
        <g {...LINE}>
          <rect x="20" y="6" width="8" height="6" rx="2" />
          <path d="M21 12h6v14l-3 4-3-4Z" />
          <path d="M24 35c-2 2.6-3 4.2-3 5.5a3 3 0 0 0 6 0c0-1.3-1-2.9-3-5.5Z" />
        </g>
      )}
    </svg>
  );
}

// Fine botanical sprig used as corner detailing on the linen surface.
function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 120" className={className} aria-hidden="true">
      <g {...LINE} strokeWidth={1}>
        <path d="M40 118C40 80 44 40 58 4" />
        <path d="M41 92c-10-2-17-9-19-18 9 1 16 7 19 18Z" />
        <path d="M43 70c9-3 15-10 16-19-9 2-15 8-16 19Z" />
        <path d="M45 50c-9-3-14-10-15-18 8 1 14 7 15 18Z" />
        <path d="M50 30c7-3 11-9 11-16-7 2-11 7-11 16Z" />
      </g>
    </svg>
  );
}

// Product media slot. Without an approved image it shows a quiet,
// clearly-labelled placeholder (never presented as a photo of the product);
// an `image` drops into the same frame with no layout change. Generated
// packaging mockups say so in their alt text.
export function ProductVisual({
  name,
  category,
  image,
  fit = "contain",
  priority = false,
  className,
  imageProps,
}: Props) {
  if (image) {
    return (
      <figure
        className={cn("relative overflow-hidden rounded-card bg-forest-panel", className)}
        data-testid="product-image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...imageProps}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn("size-full", fit === "contain" ? "object-contain" : "object-cover", imageProps?.className)}
        />
      </figure>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${name}: product photography coming soon`}
      data-testid="product-placeholder"
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-card bg-linen text-botanical-ink",
        className,
      )}
    >
      <Sprig className="absolute -right-3 -bottom-4 h-40 w-auto opacity-30 sm:h-52" />
      <div className="relative flex flex-col items-center gap-4">
        <span className="flex size-24 items-center justify-center rounded-full border border-linen-line sm:size-28">
          <CategoryMark category={category} />
        </span>
        <span className="font-sans text-xs font-medium uppercase tracking-[0.2em]">{category}</span>
      </div>
      <span className="absolute inset-x-0 bottom-4 text-center font-sans text-xs text-botanical-ink/80">
        Product photography coming soon
      </span>
    </div>
  );
}
