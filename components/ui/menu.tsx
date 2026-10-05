"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface MenuProps {
  /** Accessible name for the trigger button, like "Backup options". */
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
}

/** A small popover menu. Closes on Escape, outside click and after an item runs. */
export function Menu({ label, trigger, children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-control bg-surface px-3 hover:bg-ground"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-30 flex min-w-48 flex-col gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** One row in a Menu. */
export function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-[14px] font-medium hover:bg-ground"
    >
      {children}
    </button>
  );
}
