import jsQR from "jsqr";
import sharp from "sharp";
import { buildGeometry } from "@/lib/qr/geometry";
import { createMatrix } from "@/lib/qr/matrix";
import { renderSvg } from "@/lib/qr/render-svg";

/** A flat blue square with a white dot, standing in for a favicon or upload. */
export async function makeLogoDataUrl(size = 256): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#2B50FF"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="#FFFFFF"/></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export interface BuildOptions {
  fg?: string;
  bg?: string;
  logoDataUrl?: string;
}

/** Runs the real pipeline: payload to matrix to geometry to SVG markup. */
export function buildSvg(payload: string, options: BuildOptions = {}) {
  const matrix = createMatrix(payload);
  const geometry = buildGeometry(matrix, payload, Boolean(options.logoDataUrl));
  const svg = renderSvg(geometry, {
    fg: options.fg ?? "#111113",
    bg: options.bg ?? "#FFFFFF",
    logoDataUrl: options.logoDataUrl,
  });
  return { matrix, geometry, svg };
}

/** Rasterizes the SVG with librsvg and decodes it with jsQR, like a camera would. */
export async function scan(svg: string, pixels = 800): Promise<string | null> {
  const sized = svg.replace("<svg ", `<svg width="${pixels}" height="${pixels}" `);
  const { data, info } = await sharp(Buffer.from(sized))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  return result ? result.data : null;
}
