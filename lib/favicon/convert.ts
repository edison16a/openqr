import sharp, { type Sharp } from "sharp";
import { readIco } from "./ico";

/** Every icon leaves the server as a square PNG this wide. */
export const ICON_SIZE = 256;
const MAX_INPUT_PIXELS = 4096 * 4096;

export interface ConvertedIcon {
  png: Buffer;
  /** Largest side of the original, so the UI can warn about tiny icons. */
  sourceSize: number;
}

/**
 * SVGs from strangers can reference other files or URLs. We refuse any that
 * embed images, scripts, foreign content, entities or non local links, so the
 * rasterizer only ever sees plain shapes.
 */
export function isSafeSvg(source: string): boolean {
  if (/<!ENTITY|<script|<foreignObject|<image|<iframe|<use\b/i.test(source)) return false;
  return !/(?:xlink:)?href\s*=\s*["'](?!#)/i.test(source);
}

/** Fits any decoded image into a transparent 256 px square without stretching. */
async function normalize(input: Sharp, sourceSize: number): Promise<ConvertedIcon> {
  const png = await input
    .resize(ICON_SIZE, ICON_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return { png, sourceSize };
}

/**
 * Re-encodes a downloaded icon to a 256 px PNG. The browser never receives the
 * original bytes, which is how SVG and other odd formats from third party
 * sites stay out of the page. Returns null when the bytes are not a usable image.
 */
export async function convertIcon(body: Buffer, contentType: string): Promise<ConvertedIcon | null> {
  try {
    const limits = { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" as const };
    if (contentType.includes("icon") || contentType === "application/octet-stream") {
      const ico = readIco(body);
      if (ico?.kind === "png") return normalize(sharp(ico.data, limits), ico.size);
      if (ico?.kind === "raw") {
        const raw = { width: ico.width, height: ico.height, channels: 4 as const };
        return normalize(sharp(ico.rgba, { raw }), ico.size);
      }
    }
    if (contentType.includes("svg")) {
      if (!isSafeSvg(body.toString("utf8"))) return null;
      return normalize(sharp(body, { ...limits, density: 300 }), ICON_SIZE);
    }
    const meta = await sharp(body, limits).metadata();
    const side = Math.max(meta.width ?? 0, meta.pageHeight ?? meta.height ?? 0);
    return normalize(sharp(body, limits), side);
  } catch {
    return null;
  }
}
