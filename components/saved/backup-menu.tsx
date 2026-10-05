"use client";

import { useRef } from "react";
import { MoreIcon } from "@/components/ui/icons";
import { Menu, MenuItem } from "@/components/ui/menu";

interface BackupMenuProps {
  onExport: () => void;
  onImport: (file: File) => void;
}

/**
 * Export and import sit in a small menu, since most people never need them.
 * They exist so codes can move between browsers, because nothing is stored on a server.
 */
export function BackupMenu({ onExport, onImport }: BackupMenuProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Menu label="Backup options" trigger={<MoreIcon size={20} />}>
        {(close) => (
          <>
            <MenuItem
              onClick={() => {
                onExport();
                close();
              }}
            >
              Export backup
            </MenuItem>
            <MenuItem
              onClick={() => {
                input.current?.click();
                close();
              }}
            >
              Import backup
            </MenuItem>
          </>
        )}
      </Menu>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Import a backup file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = "";
        }}
      />
    </>
  );
}
