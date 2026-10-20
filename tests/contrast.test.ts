import { describe, expect, it } from "vitest";
import { blendOver, contrastRatio } from "@/lib/contrast";

// Current production token values (app/globals.css / lib/tokens.ts).
// P3-P14: retuned to the waterfall/serum footage — the cool lime accent became
// the scene's sun-gold, emerald shifted toward the jade pool and canopy shade.
// Variable names keep their historical lime/emerald labels only where the
// CSS var name is unchanged; the values mirror the live CSS vars, so keep them
// in sync whenever the tokens change.
const EMERALD_DEEP = "#0D1C16"; // --forest-deep
const EMERALD_MID = "#1D3A2F"; // --forest
const LIME = "#E3C585"; // --gold (sun-gold accent; was lime #C7E04A)
const LIME_DEEP = "#C9A660"; // --gold-deep (hover shade, used as a bg, not text-on-cream)
const CREAM = "#FBF7EE"; // --cream
const SAGE_MUTED = "#DBE5D9"; // --sage-muted
const GLASS_SOLID = "rgba(9,22,17,0.84)"; // --glass-solid (backdrop-filter fallback)
const GLASS_CONTENT = "rgba(10,26,20,0.58)"; // --glass (md+, with 18px panel blur)
const GLASS_VEIL = "rgba(9,22,17,0.60)"; // --glass-veil (md+, hero/statement/closing backing)
const GLASS_MOBILE = "rgba(9,22,17,0.64)"; // .glass-surface below md (no blur)
const SURFACE_NAV = "rgba(10,24,19,0.72)"; // --surface-nav
// Brightest sustained region sampled across the full 10s hero loop (ffmpeg,
// 16x16 block-averaged frames at t=0/3/6/9s, max-luminance block per frame).
// This is the realistic worst case content panels actually sit over — not an
// arbitrary pure-white frame, which this footage never produces.
const BRIGHT_FRAME = "#EDDCC7"; // P3-P12: resampled for the waterfall/serum footage (was #C1B594)

describe("contrastRatio", () => {
  it("black on white is 21:1", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 2);
  });

  it("cream on emerald-deep is at least 7:1", () => {
    expect(contrastRatio(CREAM, EMERALD_DEEP)).toBeGreaterThanOrEqual(7);
  });

  it("cream on emerald-mid (botanical/primary button rest state) is at least 4.5:1", () => {
    expect(contrastRatio(CREAM, EMERALD_MID)).toBeGreaterThanOrEqual(4.5);
  });

  it("lime on emerald-deep (nav links, accent words) is at least 4.5:1", () => {
    expect(contrastRatio(LIME, EMERALD_DEEP)).toBeGreaterThanOrEqual(4.5);
  });

  it("emerald-deep text on lime (lime-filled button rest state) is at least 4.5:1", () => {
    expect(contrastRatio(EMERALD_DEEP, LIME)).toBeGreaterThanOrEqual(4.5);
  });

  it("emerald-deep text on lime-deep (lime-filled button hover state) is at least 4.5:1", () => {
    expect(contrastRatio(EMERALD_DEEP, LIME_DEEP)).toBeGreaterThanOrEqual(4.5);
  });

  it("lime on cream is below 3:1 (never pairs lime text directly on cream)", () => {
    expect(contrastRatio(LIME, CREAM)).toBeLessThan(3);
  });

  it("sage-muted on glass-solid over emerald-deep is at least 4.5:1", () => {
    const blended = blendOver(GLASS_SOLID, EMERALD_DEEP);
    expect(contrastRatio(SAGE_MUTED, blended)).toBeGreaterThanOrEqual(4.5);
  });

  it("cream on glass-solid over a white worst-case background is at least 4.5:1", () => {
    const blended = blendOver(GLASS_SOLID, "#FFFFFF");
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });

  it("cream on content glass over emerald-deep is at least 4.5:1", () => {
    const blended = blendOver(GLASS_CONTENT, EMERALD_DEEP);
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });

  it("cream on footer surface (emerald-deep at 92%) over a white worst-case is at least 4.5:1", () => {
    const blended = blendOver("rgba(13,28,22,0.92)", "#FFFFFF");
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });

  // P3-P10 dropped --glass from 0.92 to 0.20 so the footage reads through
  // panels, and stated that cream text could not then hold 4.5:1 over
  // BRIGHT_FRAME. P3-P14 measured contrast at the real text locations across
  // four frames of the loop (Playwright: text hidden, p95 background luminance
  // under each text run) and found 180 sub-threshold runs at 0.20. Content
  // glass is now 0.58 at md+ (with 18px blur; still visibly transparent) and
  // 0.64 below md (no blur), so cream body copy clears 4.5:1 even unblurred
  // over the brightest sampled region. Sage-muted is NOT guaranteed there at
  // md+ — it is reserved for eyebrows/metadata and was verified per location
  // by the same screenshot audit (see PUBLISH report).
  it("cream on content glass over BRIGHT_FRAME (unblurred worst case) is at least 4.5:1", () => {
    expect(contrastRatio(CREAM, blendOver(GLASS_CONTENT, BRIGHT_FRAME))).toBeGreaterThanOrEqual(4.5);
  });

  it("cream on veil glass over BRIGHT_FRAME is at least 4.5:1", () => {
    expect(contrastRatio(CREAM, blendOver(GLASS_VEIL, BRIGHT_FRAME))).toBeGreaterThanOrEqual(4.5);
  });

  it("cream and sage-muted on mobile (no-blur) glass over BRIGHT_FRAME are at least 4.5:1", () => {
    const blended = blendOver(GLASS_MOBILE, BRIGHT_FRAME);
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(SAGE_MUTED, blended)).toBeGreaterThanOrEqual(4.5);
  });

  it("BRIGHT_FRAME is darker than literal white (sanity check on the fixture itself)", () => {
    expect(contrastRatio("#FFFFFF", BRIGHT_FRAME)).toBeGreaterThan(1);
  });

  // Regression coverage for the P3-P4 defect (a scrim that faded to fully
  // transparent inside the text bounds). --glass-solid is now the fallback
  // fill when backdrop-filter is unsupported, so every text colour must still
  // clear 4.5:1 on it against a white worst case.
  it("sage-muted on glass-solid over a white worst-case background is at least 4.5:1", () => {
    const blended = blendOver(GLASS_SOLID, "#FFFFFF");
    expect(contrastRatio(SAGE_MUTED, blended)).toBeGreaterThanOrEqual(4.5);
  });

  it("lime (hover/focus text) on glass-solid over a white worst-case background is at least 4.5:1", () => {
    const blended = blendOver(GLASS_SOLID, "#FFFFFF");
    expect(contrastRatio(LIME, blended)).toBeGreaterThanOrEqual(4.5);
  });

  // P3-P10: the nav is intentionally denser than content panels (0.66 vs 0.20)
  // per the brief ("keep nav slightly denser if required, but visibly
  // glass-like") specifically so its always-on text keeps a guaranteed
  // contrast floor even over a white worst-case frame. Nav links and the
  // "Botanicals" tagline were moved off sage-muted onto cream (nav.tsx) —
  // sage-muted cannot clear 4.5:1 at any opacity that still reads as glass.
  it("cream on surface-nav over a white worst-case background is at least 4.5:1", () => {
    const blended = blendOver(SURFACE_NAV, "#FFFFFF");
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });

  // Lime is only used in the nav for the large/bold "AURADERM" wordmark
  // (font-display text-lg) and as a hover-only accent on small nav links —
  // never as a small text's resting color. Large text only needs 3:1.
  it("lime on surface-nav over a white worst-case background is at least 3:1 (large-text wordmark)", () => {
    const blended = blendOver(SURFACE_NAV, "#FFFFFF");
    expect(contrastRatio(LIME, blended)).toBeGreaterThanOrEqual(3);
  });
});
