// Builds public/images/products/* from the owner-supplied packaging mockups in
// public/source/product. Each mockup was visually matched to its product (see
// PRODUCT_IMAGES); filenames are not trusted for identity. Each supplied
// mockup is a styled front view (front label to camera) — no back or combined
// front/back views have been supplied, so each product has one gallery image
// (view: "front" in content/site.ts), except the scalp serum and the Hair Fall
// Defense Shampoo, whose eight-image galleries (NUMBERED_GALLERIES below) are
// numbered by the owner. Images keep their
// native size and proportions — no crop, resize, redraw or background removal —
// and are only re-encoded to WebP. Source files are left unchanged.
import { mkdirSync, readdirSync, statSync } from "node:fs";
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

// Owner-numbered galleries: public/source/product/<dir>/"Image N <subject>.png",
// N = 1 (main image) to count, re-encoded as <prefix>-NN.webp. Sorted
// numerically so "Image 10" could never land before "Image 2"; a missing,
// repeated or unnumbered file stops the build rather than being guessed at.
const NUMBERED_GALLERIES = [
  { dir: "follivance", prefix: "follivance-hair-density-serum", count: 8 },
  { dir: "hair-fall-defense-shampoo", prefix: "hair-fall-defense-shampoo", count: 8 },
];

for (const { dir, prefix, count } of NUMBERED_GALLERIES) {
  const galleryDir = path.join(SRC_DIR, dir);
  const numbered = readdirSync(galleryDir)
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .map((file) => ({ file, n: Number(/^Image (\d+)\b/.exec(file)?.[1] ?? NaN) }));
  const unnumbered = numbered.filter(({ n }) => !Number.isInteger(n));
  if (unnumbered.length > 0) {
    throw new Error(`Unnumbered ${dir} images: ${unnumbered.map(({ file }) => file).join(", ")}`);
  }
  numbered.sort((a, b) => a.n - b.n);
  const found = numbered.map(({ n }) => n).join(",");
  const expected = Array.from({ length: count }, (_, i) => i + 1).join(",");
  if (found !== expected) {
    throw new Error(`${dir} images must be numbered ${expected}; found ${found}`);
  }

  for (const { file, n } of numbered) {
    const out = `${prefix}-${String(n).padStart(2, "0")}.webp`;
    const target = path.join(OUT_DIR, out);
    const info = await sharp(path.join(galleryDir, file))
      .webp({ quality: 86, effort: 6, smartSubsample: true })
      .toFile(target);
    console.log(`${file} -> ${out}  ${info.width}x${info.height}  ${(statSync(target).size / 1024).toFixed(1)} KB`);
  }
}
