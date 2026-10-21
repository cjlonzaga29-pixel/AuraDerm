import { describe, expect, it } from "vitest";
import { findClaims } from "@/lib/claims";
import { PRODUCT_DETAILS } from "@/content/products";

describe("product details claims guard", () => {
  it("flags banned hair-care claims", () => {
    expect(findClaims("Regrows hair fast")).toEqual(["Regrows"]);
    expect(findClaims("Stops hair loss")).toEqual(["Stops hair loss"]);
    expect(findClaims("COSMOS certified organic")).toEqual(["certified organic", "COSMOS"]);
  });

  for (const product of PRODUCT_DETAILS) {
    describe(product.handle, () => {
      it("subtitle and description clear the claims guard", () => {
        expect(findClaims(product.subtitle)).toEqual([]);
        expect(findClaims(product.description)).toEqual([]);
      });

      it("key ingredients clear the claims guard", () => {
        for (const { name, benefit } of product.keyIngredients) {
          expect(findClaims(name)).toEqual([]);
          expect(findClaims(benefit)).toEqual([]);
        }
      });

      it("directions and cautions clear the claims guard", () => {
        for (const line of [...product.directions, ...product.cautions]) {
          expect(findClaims(line)).toEqual([]);
        }
      });

      it("questions and answers clear the claims guard", () => {
        for (const { question, answer, links = [] } of product.questions) {
          for (const text of [question, answer, ...links.map((l) => l.label)]) {
            expect(findClaims(text)).toEqual([]);
          }
        }
      });
    });
  }
});
