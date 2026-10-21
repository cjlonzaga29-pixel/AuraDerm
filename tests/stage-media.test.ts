import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const STAGE_DIR = join(process.cwd(), "public/stage");

const VIDEO_BUDGETS = [
  { name: "hero-1280.mp4", capBytes: 2.5 * 1_000_000 },
  { name: "hero-mobile.mp4", capBytes: 1.2 * 1_000_000 },
  { name: "hero-blur.mp4", capBytes: 0.6 * 1_000_000 },
];
const IMAGE_FILES = ["poster.webp", "poster-blur.webp"];

describe("stage media", () => {
  it("public/stage contains the 5 files, videos within their size budgets", () => {
    for (const { name, capBytes } of VIDEO_BUDGETS) {
      const filePath = join(STAGE_DIR, name);
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThanOrEqual(capBytes);
    }
    for (const name of IMAGE_FILES) {
      expect(existsSync(join(STAGE_DIR, name))).toBe(true);
    }
  });

  it("hero-1280 is 1280x720 and hero-mobile is a full-height portrait crop (skips if ffprobe unavailable)", () => {
    let ffprobeAvailable = true;
    try {
      execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    } catch {
      ffprobeAvailable = false;
    }
    if (!ffprobeAvailable) {
      console.warn(
        "[stage-media.test] ffprobe not found on PATH in this test environment — skipping decoded-resolution check",
      );
      return;
    }
    const dimensions = (name: string) => {
      const output = execFileSync(
        "ffprobe",
        [
          "-v", "error",
          "-select_streams", "v:0",
          "-show_entries", "stream=width,height",
          "-of", "csv=p=0",
          join(STAGE_DIR, name),
        ],
        { encoding: "utf-8" },
      ).trim();
      const [width, height] = output.split(",").map(Number);
      return { width, height };
    };
    expect(dimensions("hero-1280.mp4")).toEqual({ width: 1280, height: 720 });
    // Regression: the old mobile file was the whole 16:9 frame at 720px WIDE
    // (720x406), so phones magnified a 188x406 slice ~6x at DPR 3. The mobile
    // variant must keep the desktop file's full 720px height, and be wide
    // enough to cover every sub-768px portrait viewport (up to 767x1024 needs
    // 539px at 72% object-position) without upscaling.
    const mobile = dimensions("hero-mobile.mp4");
    expect(mobile.height).toBe(720);
    expect(mobile.width).toBeGreaterThanOrEqual(540);
    expect(mobile.width).toBeLessThan(mobile.height);
    expect(existsSync(join(STAGE_DIR, "hero-720.mp4"))).toBe(false);
  });

  it("no audio stream in any of the 3 stage videos (skips if ffprobe unavailable)", () => {
    let ffprobeAvailable = true;
    try {
      execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    } catch {
      ffprobeAvailable = false;
    }
    if (!ffprobeAvailable) {
      console.warn(
        "[stage-media.test] ffprobe not found on PATH in this test environment — skipping audio-stream check",
      );
      return;
    }
    for (const { name } of VIDEO_BUDGETS) {
      const output = execFileSync(
        "ffprobe",
        [
          "-v", "error",
          "-select_streams", "a",
          "-show_entries", "stream=index",
          "-of", "csv=p=0",
          join(STAGE_DIR, name),
        ],
        { encoding: "utf-8" },
      ).trim();
      expect(output).toBe("");
    }
  });
});
