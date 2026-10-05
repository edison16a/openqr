/** An sRGB color with channels in the 0 to 255 range. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Turns user typed hex into a canonical "#RRGGBB" string, or null when it is
 * not a color. Accepts "#abc", "abc", "#AABBCC" and "aabbcc" so people can
 * paste from anywhere without thinking about the hash.
 */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return `#${full.toUpperCase()}`;
}

/** Parses a canonical hex color. Callers pass the output of normalizeHex. */
export function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}
