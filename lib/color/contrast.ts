import { hexToRgb } from "./hex";

/** Why a color pair might not scan. Null means the pair looks fine. */
export type ContrastIssue = "inverted" | "low" | null;

/** Scanners generally need at least this much contrast between modules and ground. */
export const MIN_CONTRAST = 3;

/** Relative luminance as defined by WCAG 2.x, from 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colors, from 1 (same) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Checks whether a code color and background are likely to scan. A light code
 * on a dark ground is allowed but flagged, because many scanners expect dark
 * modules and fail on inverted codes. Both checks only warn, never block.
 */
export function checkContrast(fg: string, bg: string): ContrastIssue {
  if (luminance(fg) >= luminance(bg)) return "inverted";
  if (contrastRatio(fg, bg) < MIN_CONTRAST) return "low";
  return null;
}

/** Human wording for each issue, shown under the color pickers. */
export function contrastMessage(issue: ContrastIssue): string | null {
  if (issue === "inverted") {
    return "The code is lighter than the background. Many scanners can't read this.";
  }
  if (issue === "low") {
    return "Low contrast. This code may not scan, so try a darker code or lighter background.";
  }
  return null;
}
