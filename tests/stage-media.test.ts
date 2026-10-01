import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const STAGE_DIR = join(process.cwd(), "public/stage");

const VIDEO_BUDGETS = [
  { name: "hero-1280.mp4", capBytes: 2.5 * 1_000_000 },
  { name: "hero-720.mp4", capBytes: 1.2 * 1_000_000 },
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

  it("hero-1280/hero-720 decode at their named widths (skips if ffprobe unavailable)", () => {
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
    const expectedWidths: Record<string, number> = {
      "hero-1280.mp4": 1280,
      "hero-720.mp4": 720,
    };
    for (const [name, expectedWidth] of Object.entries(expectedWidths)) {
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
      expect(width).toBe(expectedWidth);
      expect(height).toBeGreaterThan(0);
    }
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
