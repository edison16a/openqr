import { blobToDataUrl } from "@/lib/image/data-url";
import { deleteImage, getImage, putCode, putImage } from "./records";
import type { LoadedCode, SavedCode } from "./types";

/** Key of the one image a record owns. Derived from the id so it is easy to clean up. */
export const imageKeyFor = (id: string) => `${id}-image`;

/**
 * Writes a record and its image together. The image goes first so a record
 * never points at a blob that was not stored. With no image, any old one the
 * record owned is removed.
 */
export async function saveCode(record: SavedCode, image: Blob | null): Promise<void> {
  const key = record.center.imageKey ?? imageKeyFor(record.id);
  if (image) await putImage(key, image);
  else await deleteImage(key);
  await putCode(record);
}

/** Loads a record's center image as a data URL, or null if it has none. */
export async function loadImageFor(record: SavedCode): Promise<{ blob: Blob; dataUrl: string } | null> {
  const key = record.center.imageKey;
  if (!key) return null;
  const blob = await getImage(key);
  return blob ? { blob, dataUrl: await blobToDataUrl(blob) } : null;
}

/** Pairs a record with its image data URL so cards can draw it. */
export async function withImage(record: SavedCode): Promise<LoadedCode> {
  const image = await loadImageFor(record);
  return { record, imageDataUrl: image?.dataUrl ?? null };
}
