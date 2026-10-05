/** Limits from the spec: common web formats, up to 5 MB. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
/** Stored size. Plenty for a logo that covers about a quarter of the code. */
export const UPLOAD_SIZE = 256;

/** Returns an error message for a file we will not accept, or null when it is fine. */
export function validateUpload(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Use a PNG, JPG, WebP or SVG image.";
  if (file.size > MAX_UPLOAD_BYTES) return "That file is over 5 MB. Try a smaller image.";
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = url;
  });
}

/**
 * Turns an uploaded file into a 256 px square PNG, entirely in the browser.
 * SVGs are rasterized by loading them through an img element, which never runs
 * their scripts, and are never put into the page itself. The image is
 * center cropped so a wide photo fills the square instead of being squashed.
 */
export async function processUpload(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = UPLOAD_SIZE;
    canvas.height = UPLOAD_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.imageSmoothingQuality = "high";

    // Some SVGs report no natural size. Draw those across the whole square.
    const width = img.naturalWidth || UPLOAD_SIZE;
    const height = img.naturalHeight || UPLOAD_SIZE;
    const side = Math.min(width, height);
    ctx.drawImage(img, (width - side) / 2, (height - side) / 2, side, side, 0, 0, UPLOAD_SIZE, UPLOAD_SIZE);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
