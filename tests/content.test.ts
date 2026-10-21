import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/content/site";
import { PRODUCT_DETAILS, getProductDetails } from "@/content/products";

const keyIngredientText = (slug: string) =>
  (getProductDetails(slug)?.keyIngredients ?? []).map((i) => i.name).join(" | ").toLowerCase();

describe("content model", () => {
  it("has the expected fixed-length collections", () => {
    // P4-P7: the homepage strip shows three botanicals; the benefit rows
    // folded into the old statement were retired with it.
    expect(site.ingredients.length).toBe(3);
    expect(site.routine.length).toBe(3);
  });

  it("open statement is distinct from the hero headline", () => {
    expect(site.statement.headline).toBe("A little care.\nFrom root to tip.");
    expect(site.statement.headline.replace("\n", " ")).not.toBe(site.hero.headline);
    expect(site.statement.headline).toContain(site.statement.accentWord);
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

  it("spotlight benefits restate the approved key-ingredient copy, not new claims", () => {
    const words = (s: string) =>
      s.toLowerCase().replace(/[^a-z ]/g, "").split(" ").filter((w) => w.length > 2);
    const listed = getProductDetails(site.spotlight.productSlug)?.keyIngredients ?? [];
    for (const callout of site.spotlight.callouts) {
      const source = listed.find((i) => i.name.toLowerCase().includes(callout.name.toLowerCase()));
      expect(source, callout.name).toBeDefined();
      expect(words(source!.benefit), callout.name).toEqual(expect.arrayContaining(words(callout.benefit)));
    }
  });

  it("spotlight links to its own product and frames a described image", () => {
    const { spotlight } = site;
    expect(spotlight.productSlug).toBe("hair-fall-defense-scalp-vitamin-serum");
    expect(spotlight.cta.href).toBe(`/shop/${spotlight.productSlug}`);
    expect(spotlight.media.image?.src).toBe("/images/home/spotlight-scalp-serum.webp");
    expect(spotlight.media.image?.illustrative).toBe(true);
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
    for (const image of [...slots.map((s) => s.image), ...site.products.flatMap((p) => p.images)]) {
      if (image === null) continue;
      expect(image.src).toMatch(/^\//);
      expect(image.alt.trim()).not.toBe("");
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
    }
  });

  it("product galleries start with the front view and never repeat an image", () => {
    for (const product of site.products) {
      if (product.images.length === 0) continue;
      expect(product.images[0].view).toBe("front");
      const srcs = product.images.map((image) => image.src);
      expect(new Set(srcs).size).toBe(srcs.length);
    }
  });

  it("every product with a priceMinor has a currency", () => {
    for (const product of site.products) {
      if (product.priceMinor !== null) {
        expect(product.currency).not.toBeNull();
      }
    }
  });

  it("sample prices are positive integer PHP minor units", () => {
    for (const product of site.products) {
      if (product.samplePrice === null) continue;
      expect(Number.isInteger(product.samplePrice.priceMinor)).toBe(true);
      expect(product.samplePrice.priceMinor).toBeGreaterThan(0);
      expect(product.samplePrice.currency).toBe("PHP");
    }
  });

  it("commerce stays off while prices are samples", () => {
    expect(site.commerce).toBe(false);
  });

  it("product display order names every product exactly once", () => {
    expect(site.productOrder.slice().sort()).toEqual(site.products.map((p) => p.slug).sort());
  });
});

describe("product questions & answers", () => {
  const handles = site.products.map((p) => p.slug);
  const qa = (handle: string) =>
    (getProductDetails(handle)?.questions ?? []).map((q) => `${q.question} ${q.answer}`).join(" ");

  it("every catalog product has 4–6 distinct questions", () => {
    for (const handle of handles) {
      const questions = getProductDetails(handle)?.questions ?? [];
      expect(questions.length, handle).toBeGreaterThanOrEqual(4);
      expect(questions.length, handle).toBeLessThanOrEqual(6);
      const asked = questions.map((q) => q.question);
      expect(new Set(asked).size, handle).toBe(asked.length);
    }
  });

  it("links point at a section the product renders or at a real product page", () => {
    for (const product of PRODUCT_DETAILS) {
      const sections: Record<string, boolean> = {
        "#how-to-use": product.directions.length > 0,
        "#cautions": product.cautions.length > 0,
      };
      for (const link of product.questions.flatMap((q) => q.links ?? [])) {
        if (link.href.startsWith("#")) {
          expect(sections[link.href], `${product.handle} ${link.href}`).toBe(true);
        } else {
          const handle = link.href.match(/^\/shop\/([a-z0-9-]+)$/)?.[1];
          expect(handle && handles.includes(handle) && handle !== product.handle, link.href).toBe(true);
        }
      }
    }
  });

  it("answers keep each product's own directions", () => {
    expect(qa("hair-fall-defense-shampoo")).toMatch(/to a lather for 1–2 minutes/);
    expect(qa("hair-fall-defense-shampoo")).toMatch(/daily use/);
    expect(qa("scalp-balance-daily-shampoo")).toMatch(/Leave the lather on for 1–2 minutes/);
    expect(qa("scalp-balance-daily-shampoo")).toMatch(/at least 2–3 times a week/);
    expect(qa("hair-fall-defense-conditioner")).toMatch(/from roots to ends/);
    expect(qa("hair-fall-defense-conditioner")).toMatch(/Leave it on for 2–3 minutes/);
    expect(qa("hair-fall-defense-conditioner")).toMatch(/rinse thoroughly/);
    const serum = qa("hair-fall-defense-scalp-vitamin-serum");
    expect(serum).toMatch(/do not rinse/i);
    expect(serum).toMatch(/for adults/);
    expect(serum).toMatch(/patch test: apply a small amount behind the ear and wait 24 hours/);
  });

  it("answers add no suitability, results, timelines or commerce claims", () => {
    const text = handles.map(qa).join(" ");
    expect(text).not.toMatch(
      /pregnan|breastfeed|child|kids|sensitive|colou?r-treated|allerg|condition(s)? like|doctor|results? in|\d+ (weeks|months)|within|guarantee|shipping|deliver|refund|return|verified|customer said/i,
    );
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
