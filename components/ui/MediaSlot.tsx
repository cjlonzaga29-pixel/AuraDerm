import { Leaf } from "lucide-react";
import type { MediaSlot as MediaSlotData } from "@/content/site";
import { cn } from "@/lib/utils";

const RATIO_CLASS: Record<MediaSlotData["ratio"], string> = {
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
  "3:2": "aspect-[3/2]",
  "4:3": "aspect-[4/3]",
};

type Props = {
  slot: MediaSlotData;
  fit?: "cover" | "contain";
  className?: string;
};

// Homepage image slot driven by content/site.ts: once a slot's `image` is set
// the photo fills this frame at the same ratio. Until then a quiet, labelled
// placeholder holds the space — never presented as a photograph.
export function MediaSlot({ slot, fit = "cover", className }: Props) {
  const frame = cn(
    "relative overflow-hidden rounded-card border border-hairline bg-forest-panel/85",
    RATIO_CLASS[slot.ratio],
    className,
  );

  if (slot.image) {
    return (
      <div className={frame} data-slot={slot.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slot.image.src}
          alt={slot.image.alt}
          width={slot.image.width}
          height={slot.image.height}
          loading="lazy"
          decoding="async"
          className={cn("size-full", fit === "contain" ? "object-contain" : "object-cover")}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${slot.subject}: photography coming soon`}
      data-slot={slot.id}
      data-testid="media-placeholder"
      className={cn(frame, "flex flex-col items-center justify-center gap-3 text-sage-muted")}
    >
      <Leaf className="size-6 opacity-70" strokeWidth={1.25} aria-hidden="true" />
      <span className="font-sans text-sm">Photography coming soon</span>
    </div>
  );
}
