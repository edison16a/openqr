import { blobToDataUrl, dataUrlToBlob, isPngDataUrl } from "@/lib/image/data-url";
import { getCode, getImage, listCodes, putCode, putImage } from "./records";
import { parseSavedCode } from "./validate";

/** Large enough for hundreds of codes with 256 px logos, small enough to refuse junk. */
const MAX_BACKUP_BYTES = 200 * 1024 * 1024;

export interface ImportSummary {
  added: number;
  updated: number;
  skipped: number;
}

/** Builds the backup JSON, with each code's image embedded as a data URL. */
export async function createBackup(): Promise<Blob> {
  const codes = await Promise.all(
    (await listCodes()).map(async (record) => {
      const blob = record.center.imageKey ? await getImage(record.center.imageKey) : undefined;
      return { ...record, image: blob ? await blobToDataUrl(blob) : null };
    }),
  );
  const backup = { app: "openqr", version: 1, exportedAt: new Date().toISOString(), codes };
  return new Blob([JSON.stringify(backup)], { type: "application/json" });
}

/**
 * Restores codes from a backup file. A code already here is replaced only when
 * the backup copy is newer, so importing an old backup never undoes later edits.
 * Anything that fails validation is skipped, not guessed at.
 */
export async function importBackup(file: File): Promise<ImportSummary> {
  if (file.size > MAX_BACKUP_BYTES) throw new Error("too large");
  const data: unknown = JSON.parse(await file.text());
  const list = (data as { codes?: unknown })?.codes;
  if (!Array.isArray(list)) throw new Error("not a backup");

  const summary: ImportSummary = { added: 0, updated: 0, skipped: 0 };
  for (const item of list) {
    const record = parseSavedCode(item);
    if (!record) {
      summary.skipped++;
      continue;
    }
    const existing = await getCode(record.id);
    if (existing && existing.updatedAt >= record.updatedAt) {
      summary.skipped++;
      continue;
    }
    const image = (item as { image?: unknown }).image;
    // A record that needs an image but has no valid one is not worth keeping.
    if (record.center.imageKey) {
      if (!isPngDataUrl(image)) {
        summary.skipped++;
        continue;
      }
      await putImage(record.center.imageKey, await dataUrlToBlob(image));
    }
    await putCode(record);
    if (existing) summary.updated++;
    else summary.added++;
  }
  return summary;
}
