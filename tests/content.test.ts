import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/content/site";
import { getProductDetails } from "@/content/products";

const keyIngredientText = (slug: string) =>
  (getProductDetails(slug)?.keyIngredients ?? []).map((i) => i.name).join(" | ").toLowerCase();

describe("content model", () => {
  it("has the expected fixed-length collections", () => {
    // P4-P7: the homepage strip shows three botanicals; the benefit rows
    // folded into the old statement were retired with it.
    expect(site.ingredients.length).toBe(3);
    expect(site.routine.length).toBe(3);
  });

  it("ingredient foundIn mappings match the label key-ingredient lists exactly", () => {
    for (const ingredient of site.ingredients) {
      // Labels group oils ("Batana, Argan & Jojoba Oils"), so match the botanical's first word.
      const name = ingredient.name.split(" ")[0].toLowerCase();
      const listed = site.products
        .map((p) => p.slug)
        .filter((slug) => keyIngredientText(slug).includes(name));
      expect(ingredient.foundIn.slice().sort(), ingredient.name).toEqual(listed.sort());
    }
  });

  it("spotlight callouts are key ingredients of the spotlit product", () => {
    const text = keyIngredientText(site.spotlight.productSlug);
    expect(text).not.toBe("");
    expect(site.spotlight.callouts).toHaveLength(3);
    for (const callout of site.spotlight.callouts) {
      expect(text, callout.name).toContain(callout.name.toLowerCase());
    }
  });

  it("image slots are unique and either empty or fully described", () => {
    const slots = [
      site.editorial.media,
      site.spotlight.media,
      site.routineIntro.media,
      ...site.ingredients.map((i) => i.media),
    ];
    const ids = slots.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const image of [...slots.map((s) => s.image), ...site.products.map((p) => p.image)]) {
      if (image === null) continue;
      expect(image.src).toMatch(/^\//);
      expect(image.alt.trim()).not.toBe("");
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
    }
  });

  it("every product with a priceMinor has a currency", () => {
    for (const product of site.products) {
      if (product.priceMinor !== null) {
        expect(product.currency).not.toBeNull();
      }
    }
  });
});

const HEX_OR_RGB = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

function collectTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  let files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files = files.concat(collectTsxFiles(fullPath));
    } else if (entry.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("no hardcoded colors in components or app", () => {
  it("no .tsx file under components/ or app/ contains a hex/rgb literal", () => {
    const root = process.cwd();
    const files = [
      ...collectTsxFiles(join(root, "components")),
      ...collectTsxFiles(join(root, "app")),
    ];
    const offenders = files.filter((file) =>
      HEX_OR_RGB.test(readFileSync(file, "utf-8")),
    );
    expect(offenders).toEqual([]);
  });
});
