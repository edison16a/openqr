import { describe, expect, it } from "vitest";
import { parseSavedCode } from "@/lib/storage/validate";
import { pngFileName, slugify } from "@/lib/export/filename";

const good = {
  id: "qr_8f2k1a",
  createdAt: "2026-10-05T19:40:00Z",
  updatedAt: "2026-10-05T19:42:10Z",
  type: "link",
  fields: ["https://openqr.app"],
  center: { kind: "favicon", host: "openqr.app", imageKey: "whatever" },
  colors: { fg: "#111113", bg: "#fff" },
};

describe("parseSavedCode", () => {
  it("rebuilds payload, title, colors and image key instead of trusting the file", () => {
    const record = parseSavedCode({ ...good, payload: "javascript:alert(1)", title: "evil" });
    expect(record).toMatchObject({
      payload: "https://openqr.app",
      title: "openqr.app",
      colors: { fg: "#111113", bg: "#FFFFFF" },
      center: { kind: "favicon", host: "openqr.app", imageKey: "qr_8f2k1a-image" },
    });
  });

  it("drops the image key when the code has no center image", () => {
    expect(parseSavedCode({ ...good, center: { kind: "none" } })?.center.imageKey).toBeUndefined();
  });

  it.each([
    ["not an object", "nope"],
    ["bad id", { ...good, id: "../../etc" }],
    ["bad date", { ...good, createdAt: "yesterday" }],
    ["unknown type", { ...good, type: "sms" }],
    ["wrong field count", { ...good, type: "wifi", fields: ["only one"] }],
    ["non string fields", { ...good, fields: [42] }],
    ["bad center kind", { ...good, center: { kind: "video" } }],
    ["bad color", { ...good, colors: { fg: "red", bg: "#fff" } }],
    ["content that cannot encode", { ...good, fields: ["not a link"] }],
  ])("rejects %s", (_name, value) => {
    expect(parseSavedCode(value)).toBeNull();
  });
});

describe("file names", () => {
  it("slugifies titles", () => {
    expect(slugify("Example.com")).toBe("example-com");
    expect(slugify("  Café & Bar!! ")).toBe("caf-bar");
    expect(slugify("???")).toBe("code");
  });

  it("matches the openqr-example-com-20261005.png pattern", () => {
    expect(pngFileName("example.com", new Date(2026, 9, 5))).toBe("openqr-example-com-20261005.png");
  });
});
