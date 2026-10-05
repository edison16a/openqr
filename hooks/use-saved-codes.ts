import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { isQuotaError, storageAvailable } from "@/lib/storage/db";
import { createBackup, importBackup } from "@/lib/storage/backup";
import { deleteCode, deleteImage, listCodes, purgeOrphanImages, putCode } from "@/lib/storage/records";
import { withImage } from "@/lib/storage/save";
import type { LoadedCode } from "@/lib/storage/types";
import { saveBlob } from "@/lib/export/download";

type Status = "loading" | "ready" | "unavailable";

/** How long Delete can be undone. Matches the toast, then the image is purged. */
const UNDO_MS = 5000;

/** Everything the Saved codes page needs: the list, delete with undo, and backups. */
export function useSavedCodes() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [codes, setCodes] = useState<LoadedCode[]>([]);

  const reload = useCallback(async () => {
    const records = await listCodes();
    setCodes(await Promise.all(records.map(withImage)));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!(await storageAvailable())) return active && setStatus("unavailable");
      try {
        await purgeOrphanImages();
        await reload();
        if (active) setStatus("ready");
      } catch {
        if (active) setStatus("unavailable");
      }
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  /** Removes the record now and keeps its image for a few seconds so Undo can restore it. */
  const remove = useCallback(
    async ({ record }: LoadedCode) => {
      setCodes((current) => current.filter((c) => c.record.id !== record.id));
      await deleteCode(record.id);
      let undone = false;
      toast({
        message: "Deleted",
        actionLabel: "Undo",
        duration: UNDO_MS,
        onAction: async () => {
          undone = true;
          await putCode(record);
          await reload();
        },
      });
      setTimeout(() => {
        if (!undone && record.center.imageKey) void deleteImage(record.center.imageKey);
      }, UNDO_MS);
    },
    [reload, toast],
  );

  const exportAll = useCallback(async () => {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    saveBlob(await createBackup(), `openqr-backup-${stamp}.json`);
  }, []);

  const importFile = useCallback(
    async (file: File) => {
      try {
        const { added, updated, skipped } = await importBackup(file);
        await reload();
        const parts = [`${added} added`, updated ? `${updated} updated` : null, skipped ? `${skipped} skipped` : null];
        toast({ message: `Import done: ${parts.filter(Boolean).join(", ")}.`, duration: 5000 });
      } catch (error) {
        toast({
          message: isQuotaError(error)
            ? "Storage is full. Delete old codes and try again."
            : "That file is not an OpenQR backup.",
        });
      }
    },
    [reload, toast],
  );

  return { status, codes, remove, exportAll, importFile };
}
