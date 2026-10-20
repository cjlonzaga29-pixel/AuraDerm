import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/content/site";

describe("content model", () => {
  it("has the expected fixed-length collections", () => {
    expect(site.ingredients.length).toBe(5);
    expect(site.benefits.length).toBe(3);
    expect(site.routine.length).toBe(3);
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
