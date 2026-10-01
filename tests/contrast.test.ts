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
const GLASS_SOLID = "rgba(15,35,24,0.82)"; // --glass-solid
const GLASS_DESKTOP = "rgba(28,58,40,0.45)"; // --glass

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

  it("cream on desktop glass over emerald-deep is at least 4.5:1", () => {
    const blended = blendOver(GLASS_DESKTOP, EMERALD_DEEP);
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });

  it("cream on footer surface (emerald-deep at 92%) over a white worst-case is at least 4.5:1", () => {
    const blended = blendOver("rgba(15,35,24,0.92)", "#FFFFFF");
    expect(contrastRatio(CREAM, blended)).toBeGreaterThanOrEqual(4.5);
  });
});
