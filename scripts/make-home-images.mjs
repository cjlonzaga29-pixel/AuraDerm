// Builds homepage images (public/images/home, public/images/ingredients) from
// owner-supplied imagery. Each source was
// visually matched to its homepage slot; filenames are not trusted for
// identity. Images keep their native size and proportions (no crop or
// upscale) and are only re-encoded to WebP. Source files are left unchanged.
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

const HOME_IMAGES = [
  {
    // Hands massaging the scalp at the part; already 16:9 for site.editorial.
    source: "public/images/Gentle scalp massage, healthy strands.png",
    out: "public/images/home/scalp-to-strand.webp",
  },
  {
    // Floating emerald-to-gold scalp serum bottle with its cast shadow; 4:5
    // like the site.spotlight slot, framed whole (dispenser to base).
    source: "public/images/AuraDerm Follivance in Emerald Light.png",
    out: "public/images/home/spotlight-scalp-serum.webp",
  },
  {
    // Dropper releasing serum onto the scalp part while one hand rests in the
    // hair; 4:3 like the site.routineIntro slot.
    source: "public/images/Three steps, scalp to strand/Precision scalp serum ritual.png",
    out: "public/images/home/routine-scalp-serum.webp",
  },
  // Ingredient stills, each 3:2 like the site.ingredients slots.
  {
    // Cut aloe vera leaves and two halved pieces showing clear gel.
    source: "public/images/ingredients/Sliced Aloe Vera with Fresh Gel.png",
    out: "public/images/ingredients/aloe-vera.webp",
  },
  {
    // Dark red palm fruits, one halved, beside a glass bowl of amber oil.
    source: "public/images/ingredients/Batana Oil with American Palm Fruit.png",
    out: "public/images/ingredients/batana-oil.webp",
  },
  {
    // Flowering rosemary sprigs on a limestone block.
    source: "public/images/ingredients/Rosemary Sprigs on Warm Limestone.png",
    out: "public/images/ingredients/rosemary.webp",
  },
];

for (const { source, out } of HOME_IMAGES) {
  const target = path.join(ROOT, out);
  mkdirSync(path.dirname(target), { recursive: true });
  const info = await sharp(path.join(ROOT, source))
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(target);
  console.log(`${out}  ${info.width}x${info.height}  ${(statSync(target).size / 1024).toFixed(1)} KB`);
}
