import { describe, expect, it } from "vitest";
import { QUIET_ZONE } from "@/lib/qr/geometry";
import { LOGO_FRACTION_MAX, planLogo } from "@/lib/qr/limits";
import { buildSvg, makeLogoDataUrl } from "./helpers";

describe("geometry", () => {
  it("adds a four module quiet zone on every side", () => {
    const { matrix, geometry } = buildSvg("https://openqr.app");
    expect(geometry.size).toBe(matrix.size + QUIET_ZONE * 2);
  });

  it("merges every dark module into one path", () => {
    const { svg } = buildSvg("https://openqr.app");
    expect(svg.match(/<path /g)).toHaveLength(1);
  });

  it("keeps the plate at 24 percent of the code width, centered", async () => {
    const logoDataUrl = await makeLogoDataUrl();
    const { matrix, geometry } = buildSvg("https://openqr.app", { logoDataUrl });
    const plate = geometry.plate!;
    expect(plate.size / matrix.size).toBeCloseTo(0.24, 5);
    expect(plate.size / matrix.size).toBeLessThanOrEqual(LOGO_FRACTION_MAX);
    expect(plate.x + plate.size / 2).toBeCloseTo(geometry.size / 2, 5);
  });

  it("has no plate without a logo", () => {
    expect(buildSvg("hello").geometry.plate).toBeNull();
  });
});

describe("logo plan", () => {
  it("shrinks above 300 characters and turns off above 1000", () => {
    expect(planLogo("a".repeat(300)).fraction).toBe(0.24);
    expect(planLogo("a".repeat(301))).toMatchObject({ fraction: 0.2 });
    expect(planLogo("a".repeat(301)).warning).toBeTruthy();
    expect(planLogo("a".repeat(1001)).fraction).toBe(0);
  });
});

describe("svg output", () => {
  it("embeds the logo as a data uri and paints the plate in the background color", async () => {
    const logoDataUrl = await makeLogoDataUrl();
    const { svg } = buildSvg("https://openqr.app", { logoDataUrl, bg: "#FFEEDD" });
    expect(svg).toContain(`href="${logoDataUrl}"`);
    expect(svg).toContain('rx=');
    expect(svg.match(/fill="#FFEEDD"/g)!.length).toBeGreaterThanOrEqual(2);
  });
});
