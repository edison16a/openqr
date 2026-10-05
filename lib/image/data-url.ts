/** Reads a Blob into a data URL. Data URLs travel inside SVG and survive a backup export. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Turns a data URL back into a Blob, for storing images from a backup file. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

/** Only accept the PNG data URLs we wrote ourselves when importing a backup. */
export function isPngDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value);
}
