import { describe, expect, it } from "vitest";
import { MAX_ZOOM, containedRect, magnify, zoomFor } from "@/lib/magnifier";

const PORTRAIT = { width: 1122, height: 1402 };
const LANDSCAPE = { width: 1920, height: 1080 };

describe("containedRect", () => {
  it("fills a box of the same ratio with no letterbox", () => {
    const rect = containedRect({ width: 561, height: 701 }, PORTRAIT);
    expect(rect.left).toBeCloseTo(0, 0);
    expect(rect.top).toBeCloseTo(0, 0);
    expect(rect.width).toBeCloseTo(561, 0);
  });

  it("pillarboxes a portrait image in a wide box", () => {
    const rect = containedRect({ width: 800, height: 400 }, PORTRAIT);
    expect(rect.top).toBe(0);
    expect(rect.height).toBe(400);
    expect(rect.width).toBeCloseTo(400 * (1122 / 1402), 5);
    expect(rect.left).toBeCloseTo((800 - rect.width) / 2, 5);
  });

  it("letterboxes a landscape front/back image in a 4:5 frame", () => {
    const rect = containedRect({ width: 480, height: 600 }, LANDSCAPE);
    expect(rect.left).toBe(0);
    expect(rect.width).toBe(480);
    expect(rect.height).toBe(270);
    expect(rect.top).toBe(165);
  });

  it("returns an empty rect before the image has dimensions", () => {
    expect(containedRect({ width: 480, height: 600 }, { width: 0, height: 0 }).width).toBe(0);
  });
});

describe("zoomFor", () => {
  it("caps at ~2× when the source has room", () => {
    expect(zoomFor({ width: 480, height: 600 }, PORTRAIT)).toBe(MAX_ZOOM);
  });

  it("never enlarges past the source's own pixels", () => {
    expect(zoomFor({ width: 700, height: 875 }, PORTRAIT)).toBeCloseTo(Math.min(1122 / 700, 1402 / 875), 5);
  });

  it("skips the preview when there is no meaningful headroom", () => {
    expect(zoomFor({ width: 1000, height: 1250 }, PORTRAIT)).toBeNull();
    expect(zoomFor({ width: 0, height: 0 }, PORTRAIT)).toBeNull();
  });
});

describe("magnify", () => {
  const content = { left: 0, top: 0, width: 480, height: 600 };
  const preview = { width: 480, height: 600 };

  it("centres the pointed-at spot at the image centre", () => {
    const view = magnify({ x: 240, y: 300 }, content, 2, preview)!;
    expect(view.image).toEqual({ width: 960, height: 1200 });
    expect(view.offset).toEqual({ x: -240, y: -300 });
    expect(view.lens).toEqual({ left: 120, top: 150, width: 240, height: 300 });
  });

  it("clamps at all four edges and corners so no space beyond the image shows", () => {
    expect(magnify({ x: 0, y: 300 }, content, 2, preview)!.offset.x).toBeCloseTo(0);
    expect(magnify({ x: 480, y: 300 }, content, 2, preview)!.offset.x).toBe(-480);
    expect(magnify({ x: 240, y: 0 }, content, 2, preview)!.offset.y).toBeCloseTo(0);
    expect(magnify({ x: 240, y: 600 }, content, 2, preview)!.offset.y).toBe(-600);
    const corner = magnify({ x: 479, y: 599 }, content, 2, preview)!;
    expect(corner.lens.left + corner.lens.width).toBe(480);
    expect(corner.lens.top + corner.lens.height).toBe(600);
  });

  it("keeps the lens and preview in step", () => {
    const view = magnify({ x: 100, y: 450 }, content, 2, preview)!;
    // Lens origin × zoom equals how far the magnified image is shifted.
    expect(view.lens.left * 2).toBeCloseTo(-view.offset.x, 5);
    expect((view.lens.top - content.top) * 2).toBeCloseTo(-view.offset.y, 5);
  });

  it("ignores letterbox padding of a landscape image", () => {
    const box = { width: 480, height: 600 };
    const rect = containedRect(box, LANDSCAPE); // top 165, height 270
    expect(magnify({ x: 240, y: 100 }, rect, 2, preview)).toBeNull();
    expect(magnify({ x: 240, y: 500 }, rect, 2, preview)).toBeNull();
    const inside = magnify({ x: 240, y: 300 }, rect, 2, { width: 480, height: 270 })!;
    // Pointer at the painted image's centre maps to the magnified centre.
    expect(inside.offset).toEqual({ x: -240, y: -135 });
    expect(inside.lens.top).toBe(165 + 67.5);
  });

  it("ignores pillarbox padding of a portrait image", () => {
    const rect = containedRect({ width: 800, height: 400 }, PORTRAIT);
    expect(magnify({ x: rect.left - 1, y: 200 }, rect, 2, preview)).toBeNull();
    expect(magnify({ x: rect.left + rect.width + 1, y: 200 }, rect, 2, preview)).toBeNull();
    expect(magnify({ x: rect.left + 1, y: 200 }, rect, 2, preview)).not.toBeNull();
  });

  it("centres an axis that is smaller than the preview instead of panning it", () => {
    const view = magnify({ x: 10, y: 10 }, { left: 0, top: 0, width: 200, height: 100 }, 1.5, preview)!;
    expect(view.offset).toEqual({ x: 90, y: 225 });
  });
});
