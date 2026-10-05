import type { QrGeometry } from "./geometry";
import type { SvgStyle } from "./render-svg";

/** Download size from the spec: 1024 px square, quiet zone included. */
export const PNG_SIZE = 1024;

/** Loads an image from a data URL. Used for the logo, which is already a safe PNG. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/** Traces a rounded rectangle. Written by hand so older browsers without roundRect still work. */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
  ctx.closePath();
}

/**
 * Draws the same geometry the SVG preview uses onto a canvas, so the download
 * matches what the user saw. Path2D reads SVG path data directly, which is
 * why we never need a second code path for modules.
 */
export async function renderPng(
  geometry: QrGeometry,
  style: SvgStyle,
  pixels = PNG_SIZE,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const scale = pixels / geometry.size;
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, pixels, pixels);

  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = style.fg;
  ctx.fill(new Path2D(geometry.path));

  const { plate, logo } = geometry;
  if (plate) {
    ctx.fillStyle = style.bg;
    roundedRect(ctx, plate.x, plate.y, plate.size, plate.radius);
    ctx.fill();
  }
  if (plate && logo && style.logoDataUrl) {
    const img = await loadImage(style.logoDataUrl);
    // Fit inside the square box without stretching, centered.
    const ratio = Math.min(logo.size / img.width, logo.size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.save();
    roundedRect(ctx, logo.x, logo.y, logo.size, logo.radius);
    ctx.clip();
    ctx.drawImage(img, logo.x + (logo.size - w) / 2, logo.y + (logo.size - h) / 2, w, h);
    ctx.restore();
  }
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
  });
}
