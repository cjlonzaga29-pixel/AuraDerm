// Builds public/images/home/* from owner-supplied photography. Each source was
// visually matched to its homepage slot; filenames are not trusted for
// identity. Images keep their native size and proportions (no crop or
// upscale) and are only re-encoded to WebP. Source files are left unchanged.
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/images/home");
mkdirSync(OUT_DIR, { recursive: true });

const HOME_IMAGES = [
  {
    // Hands massaging the scalp at the part; already 16:9 for site.editorial.
    source: "public/images/Gentle scalp massage, healthy strands.png",
    out: "scalp-to-strand.webp",
  },
  {
    // Floating emerald-to-gold scalp serum bottle with its cast shadow; 4:5
    // like the site.spotlight slot, framed whole (dispenser to base).
    source: "public/images/AuraDerm Follivance in Emerald Light.png",
    out: "spotlight-scalp-serum.webp",
  },
];

for (const { source, out } of HOME_IMAGES) {
  const target = path.join(OUT_DIR, out);
  const info = await sharp(path.join(ROOT, source))
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(target);
  console.log(`${out}  ${info.width}x${info.height}  ${(statSync(target).size / 1024).toFixed(1)} KB`);
}
