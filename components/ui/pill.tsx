import type { ButtonHTMLAttributes } from "react";

type PillProps = ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean };

/** A rounded toggle, filled with ink when selected. aria-pressed carries the state. */
export function Pill({ selected, className = "", children, ...props }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-[14px] font-medium transition-colors duration-150 ${
        selected
          ? "border-ink bg-ink text-white"
          : "border-control bg-surface text-ink hover:bg-ground"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
