import { describe, expect, it } from "vitest";
import { encode } from "@/lib/qr/encode";
import type { ContentType } from "@/lib/qr/types";
import { buildSvg, makeLogoDataUrl, scan } from "./helpers";

/** One realistic filled in form per content type. */
const SAMPLES: Record<ContentType, string[]> = {
  link: ["openqr.app/some/long/path?with=query&and=more"],
  text: ["Hello from OpenQR. Plain text works too."],
  wifi: ["Home;Net", "pa:ss,word", "WPA"],
  contact: ["Ada Lovelace", "+1 555 010 0199", "ada@example.com"],
  email: ["hello@example.com"],
  phone: ["+1 (555) 010-0199"],
};

describe("every content type decodes", () => {
  for (const [type, fields] of Object.entries(SAMPLES) as [ContentType, string[]][]) {
    for (const withLogo of [false, true]) {
      it(`${type} ${withLogo ? "with a center image" : "with no center image"}`, async () => {
        const result = encode(type, fields);
        if (!result.ok) throw new Error("sample should be valid");
        const logoDataUrl = withLogo ? await makeLogoDataUrl() : undefined;
        const { svg } = buildSvg(result.payload, { logoDataUrl });
        expect(await scan(svg)).toBe(result.payload);
      });
    }
  }
});

describe("colors and density", () => {
  it("decodes a colored code on a tinted background", async () => {
    const { svg } = buildSvg("https://openqr.app", { fg: "#1F3D2B", bg: "#F3EFE6" });
    expect(await scan(svg)).toBe("https://openqr.app");
  });

  it("still decodes a long payload with the smaller logo", async () => {
    const payload = "https://example.com/" + "a".repeat(450);
    const { svg, geometry } = buildSvg(payload, { logoDataUrl: await makeLogoDataUrl() });
    expect(geometry.warning).toBeTruthy();
    expect(await scan(svg, 1200)).toBe(payload);
  });
});
