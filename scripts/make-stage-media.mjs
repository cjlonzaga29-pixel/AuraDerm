// Builds public/stage/* from public/source/hero.mp4 (owner footage) or, if absent,
// a neutral placeholder gradient. Requires system ffmpeg/ffprobe on PATH.
// [CONTENT: hero video] — placeholder is used whenever public/source/hero.mp4 is missing.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/source/hero.mp4");
const OUT_DIR = path.join(ROOT, "public/stage");
mkdirSync(OUT_DIR, { recursive: true });

const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";
const FFPROBE = process.env.FFPROBE_BIN || "ffprobe";

function run(bin, args) {
  execFileSync(bin, args, { stdio: "inherit" });
}

function probe(args) {
  return execFileSync(FFPROBE, args, { encoding: "utf-8" }).trim();
}

const hasSource = existsSync(SRC);
let duration;
let inputArgs;

if (hasSource) {
  duration = parseFloat(
    probe([
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      SRC,
    ]),
  );
  const resolution = probe([
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0",
    SRC,
  ]);
  const sizeMb = (statSync(SRC).size / 1_000_000).toFixed(2);
  console.log(
    `[stage-media] source: public/source/hero.mp4 duration=${duration.toFixed(2)}s resolution=${resolution} size=${sizeMb}MB`,
  );
  inputArgs = ["-i", SRC];
} else {
  duration = 10;
  console.log(
    "[stage-media] public/source/hero.mp4 not found — generating neutral placeholder gradient [CONTENT: hero video]",
  );
  inputArgs = ["-f", "lavfi", "-i", `color=s=1920x1080:d=${duration}:r=30`];
}

// forest (#2F4A2A = 47,74,42) at top -> forest-deep (#15231A = 21,35,26) at bottom.
const GRADIENT_FILTER =
  "format=rgb24,geq=r='47-26*(Y/H)':g='74-39*(Y/H)':b='42-16*(Y/H)',format=yuv420p";

function buildFilter(width, extra) {
  const parts = [];
  if (!hasSource) parts.push(GRADIENT_FILTER);
  parts.push(`scale=${width}:-2:flags=lanczos`);
  if (extra) parts.push(extra);
  parts.push("format=yuv420p");
  return parts.join(",");
}

function encodeVideo({ name, width, extra, startCrf, capBytes }) {
  const outPath = path.join(OUT_DIR, name);
  let crf = startCrf;
  let size;
  for (;;) {
    run(FFMPEG, [
      "-y",
      ...inputArgs,
      "-t", String(duration),
      "-vf", buildFilter(width, extra),
      "-an",
      "-c:v", "libx264",
      "-crf", String(crf),
      "-preset", "medium",
      "-movflags", "+faststart",
      outPath,
    ]);
    size = statSync(outPath).size;
    if (size <= capBytes || crf >= 40) break;
    crf += 4;
  }
  console.log(
    `[stage-media] ${name}: crf=${crf} size=${(size / 1_000_000).toFixed(2)}MB (cap ${(capBytes / 1_000_000).toFixed(1)}MB)`,
  );
  return { crf, size };
}

encodeVideo({
  name: "hero-1280.mp4",
  width: 1280,
  startCrf: 26,
  capBytes: 2.5 * 1_000_000,
});

encodeVideo({
  name: "hero-720.mp4",
  width: 720,
  startCrf: 26,
  capBytes: 1.2 * 1_000_000,
});

encodeVideo({
  name: "hero-blur.mp4",
  width: 960,
  extra: "gblur=sigma=24,eq=brightness=-0.08",
  startCrf: 28,
  capBytes: 0.6 * 1_000_000,
});

// poster.webp: first frame of hero-1280, upscaled to 1920w
run(FFMPEG, [
  "-y",
  "-i", path.join(OUT_DIR, "hero-1280.mp4"),
  "-vf", "scale=1920:-2:flags=lanczos",
  "-vframes", "1",
  "-q:v", "80",
  path.join(OUT_DIR, "poster.webp"),
]);
console.log(
  `[stage-media] poster.webp: ${(statSync(path.join(OUT_DIR, "poster.webp")).size / 1_000_000).toFixed(2)}MB`,
);

// poster-blur.webp: first frame of hero-blur (already blurred + darkened), 960w
run(FFMPEG, [
  "-y",
  "-i", path.join(OUT_DIR, "hero-blur.mp4"),
  "-vframes", "1",
  "-q:v", "80",
  path.join(OUT_DIR, "poster-blur.webp"),
]);
console.log(
  `[stage-media] poster-blur.webp: ${(statSync(path.join(OUT_DIR, "poster-blur.webp")).size / 1_000_000).toFixed(2)}MB`,
);

console.log("[stage-media] done.");
