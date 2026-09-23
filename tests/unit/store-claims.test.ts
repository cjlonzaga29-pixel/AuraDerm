import { describe, expect, it } from "vitest";
import { findClaims } from "@/lib/claims";
import { PRODUCTS } from "@/content/products";

describe("product catalog claims guard", () => {
  for (const product of PRODUCTS) {
    describe(product.handle, () => {
      it("title clears the claims guard", () => {
        expect(findClaims(product.title)).toEqual([]);
      });

      it("subtitle clears the claims guard", () => {
        expect(findClaims(product.subtitle)).toEqual([]);
      });

      it("description clears the claims guard", () => {
        expect(findClaims(product.description)).toEqual([]);
      });

      it("usage instructions clear the claims guard", () => {
        expect(findClaims(product.usage)).toEqual([]);
      });

      it("badges clear the claims guard", () => {
        for (const badge of product.badges ?? []) {
          expect(findClaims(badge)).toEqual([]);
        }
      });
    });
  }
});
