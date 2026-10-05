import { del, entries, get, set } from "idb-keyval";
import { codesStore, imagesStore } from "./db";
import type { SavedCode } from "./types";

/** Newest first, the order the Saved codes page shows. */
export async function listCodes(): Promise<SavedCode[]> {
  const all = await entries<string, SavedCode>(codesStore());
  return all.map(([, record]) => record).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCode(id: string): Promise<SavedCode | undefined> {
  return get<SavedCode>(id, codesStore());
}

export function putCode(record: SavedCode): Promise<void> {
  return set(record.id, record, codesStore());
}

/** Removes only the record. The image stays until the undo window closes. */
export function deleteCode(id: string): Promise<void> {
  return del(id, codesStore());
}

export function getImage(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, imagesStore());
}

export function putImage(key: string, blob: Blob): Promise<void> {
  return set(key, blob, imagesStore());
}

export function deleteImage(key: string): Promise<void> {
  return del(key, imagesStore());
}

/**
 * Deletes images no record points to. Delete with Undo leaves the blob behind
 * on purpose, so a closed tab during the undo window would otherwise leak it.
 */
export async function purgeOrphanImages(): Promise<void> {
  const [records, blobs] = await Promise.all([listCodes(), entries<string, Blob>(imagesStore())]);
  const used = new Set(records.map((r) => r.center.imageKey).filter(Boolean));
  await Promise.all(blobs.filter(([key]) => !used.has(key)).map(([key]) => deleteImage(key)));
}
