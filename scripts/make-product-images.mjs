// Builds public/images/products/* from the owner-supplied packaging mockups in
// public/source/product. Each mockup was visually matched to its product (see
// PRODUCT_IMAGES); filenames are not trusted for identity. Images keep their
// native size and proportions — no crop, resize, redraw or background removal —
// and are only re-encoded to WebP. Source files are left unchanged.
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "public/source/product");
const OUT_DIR = path.join(ROOT, "public/images/products");
mkdirSync(OUT_DIR, { recursive: true });

const PRODUCT_IMAGES = [
  {
    source: "AuraDerm Shampoo on Sage Limestone.png",
    out: "hair-fall-defense-shampoo-front.webp",
  },
  {
    source: "Botanical conditioner on sage stone.png",
    out: "hair-fall-defense-conditioner-front.webp",
  },
  {
    source: "Emerald AuraDerm serum on limestone.png",
    out: "hair-fall-defense-scalp-vitamin-serum-front.webp",
  },
  {
    source: "Scalp Balance Shampoo on Sage Limestone.png",
    out: "scalp-balance-daily-shampoo-front.webp",
  },
];

for (const { source, out } of PRODUCT_IMAGES) {
  const target = path.join(OUT_DIR, out);
  const info = await sharp(path.join(SRC_DIR, source))
    .webp({ quality: 86, effort: 6, smartSubsample: true })
    .toFile(target);
  console.log(`${out}  ${info.width}x${info.height}  ${(statSync(target).size / 1024).toFixed(1)} KB`);
}
