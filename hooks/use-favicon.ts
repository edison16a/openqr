import { useEffect, useRef, type Dispatch } from "react";
import { fetchFavicon } from "@/lib/favicon/client";
import { blobToDataUrl } from "@/lib/image/data-url";
import { currentHost } from "@/lib/generator/derive";
import type { GeneratorAction } from "@/lib/generator/state";
import type { GeneratorState } from "@/lib/generator/types";
import { useDebounced } from "./use-debounced";

/** How long the link field must sit still before we ask the server for an icon. */
const SETTLE_MS = 600;

/**
 * Looks up the favicon when the link's host changes. Waits for typing to
 * settle, sends only the hostname, and skips the call when the state already
 * has an icon for that host (for example one restored from a saved code).
 */
export function useFavicon(state: GeneratorState, dispatch: Dispatch<GeneratorAction>) {
  const host = useDebounced(currentHost(state), SETTLE_MS);
  // Read through a ref so the effect only reruns when the host changes.
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    if (!host) return;
    const known = latest.current.favicon;
    if (known?.host === host && known.status !== "loading") return;

    let cancelled = false;
    dispatch({ type: "favicon-loading", host });
    fetchFavicon(host).then(async (result) => {
      if (cancelled) return;
      if (!result) return dispatch({ type: "favicon-result", host, image: null });
      const dataUrl = await blobToDataUrl(result.blob);
      if (cancelled) return;
      dispatch({
        type: "favicon-result",
        host,
        image: { blob: result.blob, dataUrl },
        sourceSize: result.sourceSize,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [host, dispatch]);
}
