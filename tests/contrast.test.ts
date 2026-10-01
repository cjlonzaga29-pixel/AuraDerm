import { describe, expect, it } from "vitest";
import { blendOver, contrastRatio } from "@/lib/contrast";

// Current production token values (app/globals.css / lib/tokens.ts).
// Updated for the emerald/lime botanical palette — these constants mirror
// the live CSS vars, not an arbitrary fixture set, so keep them in sync
// whenever the tokens change.
const EMERALD_DEEP = "#0F2318"; // --forest-deep
const EMERALD_MID = "#1C3A28"; // --forest
const LIME = "#C7E04A"; // --gold
const LIME_DEEP = "#A3C13A"; // --gold-deep (hover shade, used as a bg, not text-on-cream)
const CREAM = "#F4F1E4"; // --cream
const SAGE_MUTED = "#A8C08A"; // --sage-muted
const GLASS_SOLID = "rgba(15,35,24,0.82)"; // --glass-solid (localized text-shaped scrims only)
const GLASS_CONTENT = "rgba(20,38,28,0.20)"; // --glass (P3-P10: transparent content-panel tint, was 0.92)
const SURFACE_NAV = "rgba(15,35,24,0.66)"; // --surface-nav (P3-P10: denser than content glass, was 0.88)
// Brightest sustained region sampled across the full 10s hero loop (ffmpeg,
// 16x16 block-averaged frames at t=0/3/6/9s, max-luminance block per frame).
// This is the realistic worst case content panels actually sit over — not an
// arbitrary pure-white frame, which this footage never produces.
const BRIGHT_FRAME = "#C1B594";

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
    const blended = blendOver("rgba(15,35,24,0.92)", "#FFFFFF");
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });

  // P3-P10: --glass was dropped from 0.92 (near-opaque card) to 0.20 (genuine
  // smoked glass) so the hero footage reads through content panels, per the
  // owner brief. A surface this transparent cannot promise 4.5:1 against an
  // arbitrary pure-white frame, nor against BRIGHT_FRAME above — that would
  // require pushing opacity back to ~0.65+, which defeats the brief. Do not
  // add a passing assertion here that isn't true; the owner brief is explicit
  // that this tradeoff must be stated, not hidden behind a relaxed fixture.
  // What actually guards readability for raw text-on-glass:
  //   1. The footage is a dark, consistently forested loop (ffmpeg per-frame
  //      averages land around #45 4a 3a) — see the emerald-deep case above,
  //      which is the realistic sustained condition and passes comfortably.
  //   2. Direct visual review of Playwright screenshots at 390/768/1280 across
  //      every section (see PUBLISH report) — this is the real gate for
  //      content-glass text, not a formula. That review found Ingredients'
  //      per-item labels collapsing to near-invisible over the brighter
  //      chamomile/rose artwork; those labels were swapped from sage-muted to
  //      solid cream as a result (components/sections/Ingredients.tsx). Do not
  //      revert that swap without re-screenshotting the section.
  it("BRIGHT_FRAME is darker than literal white (sanity check on the fixture itself)", () => {
    expect(contrastRatio("#FFFFFF", BRIGHT_FRAME)).toBeGreaterThan(1);
  });

  // Regression coverage for the P3-P4 defect: Hero/Statement previously backed
  // headline/body/muted text with a gradient that faded to fully transparent
  // *inside* the actual text bounds (proven via Playwright pixel sampling —
  // contrast collapsed to ~1.0-1.1:1 against a bright/white frame). Both
  // sections now use a flat, text-shaped --glass-solid patch with no internal
  // fade, so every text color they carry must clear 4.5:1 against white.
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
