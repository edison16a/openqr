import type { ReactNode } from "react";

interface CenterTileProps {
  label: string;
  selected: boolean;
  /** Blocks selection but stays focusable, so its tooltip can still be read. */
  disabled?: boolean;
  onClick: () => void;
  describedBy?: string;
  children: ReactNode;
  className?: string;
}

/**
 * One square option under "Center image". Selected tiles get an ink border plus
 * a 1px ring, so the state never depends on color alone.
 */
export function CenterTile({ label, selected, disabled, onClick, describedBy, children, className = "" }: CenterTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      aria-describedby={describedBy}
      onClick={() => !disabled && onClick()}
      className={`flex min-h-[88px] w-full flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-[13px] font-medium transition-colors duration-150 ${
        selected
          ? "border-ink bg-surface shadow-[0_0_0_1px_var(--color-ink)]"
          : "border-line bg-ground/60 hover:bg-ground"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
