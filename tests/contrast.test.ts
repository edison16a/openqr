import { describe, expect, it } from "vitest";
import { checkContrast, contrastRatio } from "@/lib/color/contrast";
import { normalizeHex } from "@/lib/color/hex";

describe("normalizeHex", () => {
  it("accepts short, long, hashed and bare forms", () => {
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("2b50ff")).toBe("#2B50FF");
    expect(normalizeHex(" #111113 ")).toBe("#111113");
  });
  it("rejects anything else", () => {
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("blue")).toBeNull();
    expect(normalizeHex("#12345g")).toBeNull();
  });
});

describe("checkContrast", () => {
  it("gives black on white 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });
  it("is quiet for the defaults", () => {
    expect(checkContrast("#111113", "#FFFFFF")).toBeNull();
  });
  it("flags a light code on a dark ground", () => {
    expect(checkContrast("#FFFFFF", "#111113")).toBe("inverted");
  });
  it("flags low contrast", () => {
    expect(checkContrast("#BBBBBB", "#FFFFFF")).toBe("low");
  });
});
