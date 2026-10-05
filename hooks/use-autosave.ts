import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { DerivedQr } from "@/lib/generator/derive";
import { newRecordId, toRecord } from "@/lib/generator/record";
import type { GeneratorState } from "@/lib/generator/types";
import { isQuotaError, requestPersistence, storageAvailable } from "@/lib/storage/db";
import { saveCode } from "@/lib/storage/save";

const SAVE_DELAY_MS = 800;

/** Everything that ends up in the saved record, flattened so we can tell if it changed. */
function contentKey(state: GeneratorState, derived: DerivedQr): string | null {
  if (derived.status !== "ready") return null;
  return JSON.stringify([
    state.type,
    state.fieldsByType[state.type],
    derived.payload,
    derived.logo ? state.center : "none",
    derived.logo?.dataUrl ?? null,
    state.fg,
    state.bg,
  ]);
}

/**
 * Saves the current code 800 ms after the last change, once the payload is
 * valid. The first save creates a record, later ones update it. A code just
 * opened with Edit is not rewritten until something actually changes, so
 * browsing the list does not reshuffle it.
 */
export function useAutosave(state: GeneratorState, derived: DerivedQr) {
  const toast = useToast();
  const router = useRouter();
  const id = useRef<string | null>(null);
  const createdAt = useRef<string | null>(null);
  const lastSaved = useRef<string | null>(null);
  const announced = useRef(false);

  // When a saved code is loaded, adopt its identity and treat its content as already saved.
  useEffect(() => {
    if (!state.recordId) return;
    id.current = state.recordId;
    createdAt.current = state.createdAt;
    lastSaved.current = contentKey(state, derived);
    // Only the record id should trigger this, not every keystroke after loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.recordId]);

  useEffect(() => {
    const key = contentKey(state, derived);
    if (derived.status !== "ready" || key === lastSaved.current) return;

    const timer = setTimeout(async () => {
      if (!(await storageAvailable())) return;
      const recordId = (id.current ??= newRecordId());
      const now = new Date().toISOString();
      createdAt.current ??= now;
      const record = toRecord({ ...state, createdAt: createdAt.current }, derived, recordId, now);
      try {
        await saveCode(record, derived.logo?.blob ?? null);
        lastSaved.current = key;
        if (!announced.current) {
          announced.current = true;
          void requestPersistence();
          toast({ message: "Saved" });
        }
      } catch (error) {
        if (isQuotaError(error)) {
          toast({
            message: "Storage is full. Delete old codes to save new ones.",
            actionLabel: "Open",
            onAction: () => router.push("/saved"),
            duration: 8000,
          });
        }
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, derived, toast, router]);
}
