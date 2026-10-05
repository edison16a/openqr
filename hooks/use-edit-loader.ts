import { useEffect, type Dispatch } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { fromRecord } from "@/lib/generator/record";
import type { GeneratorAction } from "@/lib/generator/state";
import { getCode } from "@/lib/storage/records";
import { loadImageFor } from "@/lib/storage/save";

/** Loads the saved code named by ?edit=<id> into the generator, once per id. */
export function useEditLoader(dispatch: Dispatch<GeneratorAction>) {
  const editId = useSearchParams().get("edit");
  const toast = useToast();

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const record = await getCode(editId);
        if (cancelled) return;
        if (!record) return toast({ message: "That saved code was not found." });
        const image = await loadImageFor(record);
        if (!cancelled) dispatch({ type: "load", state: fromRecord(record, image) });
      } catch {
        if (!cancelled) toast({ message: "Saved codes are not available in this browser." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, dispatch, toast]);
}
