import type { QrGeometry } from "./geometry";

/** Colors and the optional logo, kept apart from geometry so one layout can be restyled. */
export interface SvgStyle {
  fg: string;
  bg: string;
  /** PNG data URI for the center image. Omit for a plain code. */
  logoDataUrl?: string;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** Colors are validated hex by this point, but escape anyway so markup can never break out. */
const attr = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Serializes a code to a standalone SVG string. The React preview draws the
 * same geometry, and the tests rasterize this string to prove codes decode.
 * It is also what an SVG export button would hand out, since the logo is
 * embedded as a data URI and nothing is fetched.
 */
export function renderSvg(geometry: QrGeometry, style: SvgStyle, idPrefix = "qr"): string {
  const { size, path, plate, logo } = geometry;
  const fg = attr(style.fg);
  const bg = attr(style.bg);
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="${bg}"/>`,
    `<path d="${path}" fill="${fg}"/>`,
  ];
  if (plate) {
    parts.push(
      `<rect x="${round(plate.x)}" y="${round(plate.y)}" width="${round(plate.size)}" height="${round(plate.size)}" rx="${round(plate.radius)}" fill="${bg}"/>`,
    );
  }
  if (plate && logo && style.logoDataUrl) {
    const clip = `${idPrefix}-logo`;
    parts.push(
      `<clipPath id="${clip}"><rect x="${round(logo.x)}" y="${round(logo.y)}" width="${round(logo.size)}" height="${round(logo.size)}" rx="${round(logo.radius)}"/></clipPath>`,
      `<image href="${attr(style.logoDataUrl)}" x="${round(logo.x)}" y="${round(logo.y)}" width="${round(logo.size)}" height="${round(logo.size)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clip})"/>`,
    );
  }
  parts.push("</svg>");
  return parts.join("");
}
