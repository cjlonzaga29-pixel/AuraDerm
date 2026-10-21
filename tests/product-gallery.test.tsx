import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductGallery } from "@/components/shop/ProductGallery";
import type { CatalogImage } from "@/lib/catalog";

// Static render checks of the gallery's structure. Interaction (thumbnails,
// swipe, keyboard, focus return) is covered in tests/e2e/checkout.spec.ts for
// the single-image products that exist today.
const front: CatalogImage = { src: "/front.webp", alt: "Front of the bottle", width: 1122, height: 1402, view: "front", illustrative: true };
const back: CatalogImage = { src: "/back.webp", alt: "Back label", width: 1122, height: 1402, view: "back" };
const both: CatalogImage = { src: "/both.webp", alt: "Front and back", width: 1920, height: 1080, view: "front-back" };

const render = (images: CatalogImage[]) =>
  renderToStaticMarkup(<ProductGallery name="Test Shampoo" category="Shampoo" images={images} />);

describe("ProductGallery", () => {
  it("omits navigation for a single image but keeps enlarge and the illustrative caption", () => {
    const html = render([front]);
    expect(html).toContain("Enlarge image: Front of the bottle");
    expect(html).toContain("Illustrative packaging");
    expect(html).not.toContain("Previous image");
    expect(html).not.toContain("Next image");
    expect(html).not.toContain("Show image");
  });

  it("with several views shows previous/next and labelled thumbnails, the first selected", () => {
    const html = render([front, back, both]);
    expect(html.match(/aria-label="Previous image"/g)).toHaveLength(1);
    expect(html.match(/aria-label="Next image"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Show image 1 of 3 (Front view): Front of the bottle" aria-pressed="true"');
    expect(html).toContain('aria-label="Show image 2 of 3 (Back view): Back label" aria-pressed="false"');
    expect(html).toContain("Show image 3 of 3 (Front and back view)");
    // Every image renders contained, including the 16:9 combined view's thumb.
    expect(html.match(/object-contain/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it("falls back to the labelled placeholder with no images", () => {
    expect(render([])).toContain("product photography coming soon");
  });
});
