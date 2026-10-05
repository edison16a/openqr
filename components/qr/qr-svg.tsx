import { useId } from "react";
import type { QrGeometry } from "@/lib/qr/geometry";

interface QrSvgProps {
  geometry: QrGeometry;
  fg: string;
  bg: string;
  logoDataUrl?: string | null;
  /** Short accessible name, like "QR code for example.com". Never include a password. Empty hides it from screen readers. */
  label: string;
  className?: string;
}

/**
 * Draws a code from geometry as inline SVG. It mirrors renderSvg in lib/qr, but
 * as JSX so React owns the DOM and nothing is injected as raw markup.
 * The clip id is unique per instance because the Saved page shows many at once.
 */
export function QrSvg({ geometry, fg, bg, logoDataUrl, label, className }: QrSvgProps) {
  const clipId = useId();
  const { size, path, plate, logo } = geometry;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={size} height={size} fill={bg} />
      <path d={path} fill={fg} />
      {plate && <rect x={plate.x} y={plate.y} width={plate.size} height={plate.size} rx={plate.radius} fill={bg} />}
      {plate && logo && logoDataUrl && (
        <>
          <clipPath id={clipId}>
            <rect x={logo.x} y={logo.y} width={logo.size} height={logo.size} rx={logo.radius} />
          </clipPath>
          <image
            href={logoDataUrl}
            x={logo.x}
            y={logo.y}
            width={logo.size}
            height={logo.size}
            preserveAspectRatio="xMidYMid meet"
            clipPath={`url(#${clipId})`}
          />
        </>
      )}
    </svg>
  );
}
