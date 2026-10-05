"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon, DownloadIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import type { DerivedQr } from "@/lib/generator/derive";
import { saveBlob } from "@/lib/export/download";
import { pngFileName } from "@/lib/export/filename";
import { renderPng } from "@/lib/qr/render-png";

interface ExportActionsProps {
  derived: DerivedQr;
  fg: string;
  bg: string;
}

const noSubscribe = () => () => {};

/**
 * True only in browsers that can put an image on the clipboard. Read through
 * useSyncExternalStore so server and first client render agree (both false),
 * which avoids a hydration mismatch.
 */
function useCanCopyImage(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function",
    () => false,
  );
}

/** Download PNG and Copy. Both are off until the code is valid. */
export function ExportActions({ derived, fg, bg }: ExportActionsProps) {
  const toast = useToast();
  const canCopy = useCanCopyImage();
  const [busy, setBusy] = useState(false);
  const ready = derived.status === "ready";

  const makePng = () => {
    if (derived.status !== "ready") throw new Error("not ready");
    return renderPng(derived.geometry, { fg, bg, logoDataUrl: derived.logo?.dataUrl });
  };

  const download = async () => {
    if (derived.status !== "ready") return;
    setBusy(true);
    try {
      saveBlob(await makePng(), pngFileName(derived.title));
    } catch {
      toast({ message: "Could not create the PNG. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    setBusy(true);
    try {
      // Safari only allows clipboard writes started by a click, so hand it a promise.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": makePng() })]);
      toast({ message: "Copied" });
    } catch {
      toast({ message: "Could not copy the image. Try Download instead." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 [&>*:only-child]:sm:col-span-2">
      <Button variant="primary" icon={<DownloadIcon />} onClick={download} disabled={!ready || busy}>
        Download PNG
      </Button>
      {canCopy && (
        <Button variant="secondary" icon={<CopyIcon />} onClick={copy} disabled={!ready || busy}>
          Copy
        </Button>
      )}
    </div>
  );
}
