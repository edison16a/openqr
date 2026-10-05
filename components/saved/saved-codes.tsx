"use client";

import { ButtonLink } from "@/components/ui/button";
import { PlusIcon, WarningIcon } from "@/components/ui/icons";
import { useSavedCodes } from "@/hooks/use-saved-codes";
import { BackupMenu } from "./backup-menu";
import { SavedCard } from "./saved-card";

/** The Saved codes page body: heading, actions, then a grid of cards or a calm empty state. */
export function SavedCodes() {
  const { status, codes, remove, exportAll, importFile } = useSavedCodes();

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-bold tracking-tight sm:text-[40px]">Saved codes</h1>
        <div className="flex items-center gap-2">
          {status === "ready" && <BackupMenu onExport={exportAll} onImport={importFile} />}
          <ButtonLink href="/" variant="primary" icon={<PlusIcon size={16} />}>
            New code
          </ButtonLink>
        </div>
      </div>

      {status === "unavailable" && (
        <div role="alert" className="flex items-start gap-3 rounded-card bg-surface p-5 text-[14px]">
          <WarningIcon size={20} className="mt-0.5 shrink-0" />
          <p>
            Saving needs browser storage, and it looks blocked here. Private browsing can cause this.
            The generator still works, but new codes will not be kept.
          </p>
        </div>
      )}

      {status === "ready" && codes.length === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-card bg-surface p-8">
          <p className="text-[16px] font-semibold">Nothing saved yet</p>
          <p className="max-w-md text-[14px] text-muted">
            Every valid code is saved here automatically, in this browser only. Make one and it will show up.
          </p>
        </div>
      )}

      {codes.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 min-[820px]:grid-cols-3 min-[1088px]:grid-cols-4">
          {codes.map((code) => (
            <SavedCard key={code.record.id} code={code} onDelete={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}
