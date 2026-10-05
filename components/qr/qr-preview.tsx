"use client";

import { useEffect, useState } from "react";
import { WarningIcon } from "@/components/ui/icons";
import { useDebounced } from "@/hooks/use-debounced";
import type { DerivedQr } from "@/lib/generator/derive";
import type { GeneratorState } from "@/lib/generator/types";
import { specFor } from "@/lib/qr/content-types";
import { QrPlaceholder } from "./qr-placeholder";
import { QrSvg } from "./qr-svg";

/** Announces "QR code updated" for screen readers, but only after edits settle. */
function useUpdateAnnouncement(payload: string | null): string {
  const settled = useDebounced(payload, 600);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!settled) return;
    // Clear then set, so the live region sees a fresh change every time.
    const show = setTimeout(() => setMessage("QR code updated"), 0);
    const hide = setTimeout(() => setMessage(""), 1500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [settled]);
  return message;
}

/**
 * The always on screen preview. It has four looks: empty (placeholder and a
 * hint), live, error, and live with a gentle density warning underneath.
 */
export function QrPreview({ state, derived }: { state: GeneratorState; derived: DerivedQr }) {
  const announcement = useUpdateAnnouncement(derived.status === "ready" ? derived.payload : null);
  const warning = derived.status === "ready" ? derived.geometry.warning : null;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="aspect-square w-full max-w-[380px] overflow-hidden min-[1088px]:max-w-[440px] rounded-frame border border-line bg-surface">
        {derived.status === "ready" ? (
          <QrSvg
            geometry={derived.geometry}
            fg={state.fg}
            bg={state.bg}
            logoDataUrl={derived.logo?.dataUrl}
            label={`QR code for ${derived.title}`}
            className="size-full"
          />
        ) : derived.status === "error" ? (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-8 text-center text-[14px] font-medium">
            <WarningIcon size={28} />
            {derived.message}
          </div>
        ) : (
          <QrPlaceholder hint={specFor(state.type).emptyHint} />
        )}
      </div>
      {warning && (
        <p className="flex max-w-[380px] items-start gap-2 min-[1088px]:max-w-[440px] text-[13px] font-medium text-muted">
          <WarningIcon size={16} className="mt-0.5 shrink-0" />
          {warning}
        </p>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
