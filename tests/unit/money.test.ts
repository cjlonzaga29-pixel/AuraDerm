import { describe, expect, it } from "vitest";
import { addMoney, formatMoney, multiplyMoney } from "@/lib/money";

describe("formatMoney", () => {
  it("formats a standard peso amount", () => {
    expect(formatMoney(149900)).toBe("₱1,499.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("₱0.00");
  });

  it("formats negative amounts with a leading sign", () => {
    expect(formatMoney(-500)).toBe("-₱5.00");
  });

  it("formats a non-PHP currency with a code prefix", () => {
    expect(formatMoney(149900, "USD")).toBe("USD 1,499.00");
  });

  it("throws on non-integer minor units", () => {
    expect(() => formatMoney(149900.5)).toThrow();
  });

  it("throws on NaN", () => {
    expect(() => formatMoney(NaN)).toThrow();
  });
});

describe("addMoney", () => {
  it("sums integer amounts", () => {
    expect(addMoney(149900, 99900, 179900)).toBe(429700);
  });

  it("returns 0 for no arguments", () => {
    expect(addMoney()).toBe(0);
  });

  it("throws when any amount is a non-integer", () => {
    expect(() => addMoney(100, 1.5)).toThrow();
  });

  it("throws when any amount is NaN", () => {
    expect(() => addMoney(100, NaN)).toThrow();
  });
});

describe("multiplyMoney", () => {
  it("multiplies price by an integer quantity", () => {
    expect(multiplyMoney(149900, 3)).toBe(449700);
  });

  it("throws when minorUnits is not an integer", () => {
    expect(() => multiplyMoney(149900.25, 2)).toThrow();
  });

  it("throws when quantity is not an integer", () => {
    expect(() => multiplyMoney(149900, 1.5)).toThrow();
  });
});
