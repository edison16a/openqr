/**
 * Size rules for the center image. Long content makes a denser code with
 * smaller modules, and a logo that was safe on a sparse code can wipe out too
 * much of a dense one. These numbers come from the spec and are not options.
 */
export const LOGO_FRACTION = 0.24;
export const LOGO_FRACTION_DENSE = 0.2;
/** The plate must never grow past this share of the code width. */
export const LOGO_FRACTION_MAX = 0.26;
export const DENSE_AFTER_CHARS = 300;
export const NO_LOGO_AFTER_CHARS = 1000;
/** Level H holds about 1,273 bytes at version 40. We stop a little earlier. */
export const HARD_LIMIT_BYTES = 1270;

export interface LogoPlan {
  /** Plate width as a fraction of the code width, or 0 when the logo is off. */
  fraction: number;
  /** Set when long content forced the logo to shrink or switch off. */
  warning: string | null;
}

/** Decides how big the center plate can be for a payload of this length. */
export function planLogo(payload: string): LogoPlan {
  const length = payload.length;
  if (length > NO_LOGO_AFTER_CHARS) {
    return {
      fraction: 0,
      warning: "This content is very long, so the center image is turned off to keep the code scannable.",
    };
  }
  if (length > DENSE_AFTER_CHARS) {
    return {
      fraction: LOGO_FRACTION_DENSE,
      warning: "Long content makes a dense code, so the center image is smaller.",
    };
  }
  return { fraction: Math.min(LOGO_FRACTION, LOGO_FRACTION_MAX), warning: null };
}

/** True when the payload cannot fit in a level H code at all. */
export function exceedsCapacity(payload: string): boolean {
  return new TextEncoder().encode(payload).length > HARD_LIMIT_BYTES;
}
