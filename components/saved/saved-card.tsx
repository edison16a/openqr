"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { QrSvg } from "@/components/qr/qr-svg";
import { pngFileName } from "@/lib/export/filename";
import { saveBlob } from "@/lib/export/download";
import { geometryFor } from "@/lib/qr/build";
import { specFor } from "@/lib/qr/content-types";
import { renderPng } from "@/lib/qr/render-png";
import type { LoadedCode } from "@/lib/storage/types";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

interface SavedCardProps {
  code: LoadedCode;
  onDelete: (code: LoadedCode) => void;
}

/** One saved code: thumbnail in its own colors, title, type and date, and three actions. */
export function SavedCard({ code, onDelete }: SavedCardProps) {
  const toast = useToast();
  const { record, imageDataUrl } = code;
  const [busy, setBusy] = useState(false);
  const geometry = useMemo(() => geometryFor(record.payload, imageDataUrl !== null), [record, imageDataUrl]);
  const logoDataUrl = imageDataUrl ?? undefined;

  const download = async () => {
    setBusy(true);
    try {
      const blob = await renderPng(geometry, { fg: record.colors.fg, bg: record.colors.bg, logoDataUrl });
      saveBlob(blob, pngFileName(record.title, new Date()));
    } catch {
      toast({ message: "Could not create the PNG. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 rounded-card bg-surface p-3">
      <div className="aspect-square overflow-hidden rounded-frame">
        <QrSvg
          geometry={geometry}
          fg={record.colors.fg}
          bg={record.colors.bg}
          logoDataUrl={logoDataUrl}
          label={`QR code for ${record.title}`}
          className="size-full"
        />
      </div>
      <div className="min-w-0 px-1">
        <h2 className="truncate text-[14px] font-semibold">{record.title}</h2>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {specFor(record.type).label}, {dateFormat.format(new Date(record.updatedAt))}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1 px-3" onClick={download} disabled={busy}>
          Download
        </Button>
        <Link href={`/?edit=${record.id}`} className={buttonClasses("secondary", "px-4")}>
          Edit
        </Link>
        <Button
          variant="secondary"
          className="min-w-11 px-0"
          aria-label={`Delete ${record.title}`}
          onClick={() => onDelete(code)}
        >
          <TrashIcon size={17} />
        </Button>
      </div>
    </li>
  );
}
