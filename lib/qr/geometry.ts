import { planLogo } from "./limits";
import type { QrMatrix } from "./matrix";

/** Quiet zone in modules. The QR standard asks for four on each side. */
export const QUIET_ZONE = 4;
/** Padding inside the plate, as a share of the code width. */
const PLATE_PADDING = 0.018;
/** Plate corner radius, as a share of the plate width. */
const PLATE_RADIUS = 0.18;

export interface Rect {
  x: number;
  y: number;
  size: number;
}

/** Everything a renderer needs. Units are modules, so SVG can use it as a viewBox. */
export interface QrGeometry {
  /** Full side length including the quiet zone. */
  size: number;
  /** SVG path data for every dark module, merged into horizontal runs. */
  path: string;
  /** Rounded plate behind the logo, or null when there is no logo. */
  plate: (Rect & { radius: number }) | null;
  /** Square area the logo is fitted into, or null when there is no logo. */
  logo: (Rect & { radius: number }) | null;
  /** Set when long content shrank or disabled the logo. */
  warning: string | null;
}

/**
 * Merges dark modules into one path made of horizontal runs. One path keeps
 * the SVG tiny, and a single fill means no hairline seams between modules.
 */
export function modulesToPath(matrix: QrMatrix): string {
  const commands: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    let x = 0;
    while (x < matrix.size) {
      if (!matrix.isDark(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < matrix.size && matrix.isDark(x, y)) x++;
      commands.push(`M${start + QUIET_ZONE} ${y + QUIET_ZONE}h${x - start}v1h${start - x}z`);
    }
  }
  return commands.join("");
}

/**
 * Lays out the code, the plate and the logo box. The plate is a fraction of
 * the code width (never of the quiet zone), centered, so it covers the same
 * share of modules whatever the QR version is.
 */
export function buildGeometry(matrix: QrMatrix, payload: string, withLogo: boolean): QrGeometry {
  const size = matrix.size + QUIET_ZONE * 2;
  const path = modulesToPath(matrix);
  const plan = planLogo(payload);
  // Only warn about long content when a logo is actually being squeezed.
  const warning = withLogo ? plan.warning : null;
  if (!withLogo || plan.fraction === 0) {
    return { size, path, plate: null, logo: null, warning };
  }
  const plateSize = matrix.size * plan.fraction;
  const padding = matrix.size * PLATE_PADDING;
  const origin = (size - plateSize) / 2;
  const radius = plateSize * PLATE_RADIUS;
  const logoSize = plateSize - padding * 2;
  return {
    size,
    path,
    plate: { x: origin, y: origin, size: plateSize, radius },
    logo: {
      x: origin + padding,
      y: origin + padding,
      size: logoSize,
      radius: Math.max(radius - padding, 0),
    },
    warning,
  };
}
