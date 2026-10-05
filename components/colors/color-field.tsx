"use client";

import { useEffect, useId, useState } from "react";
import { controlClasses, InlineMessage } from "@/components/ui/text-input";
import { normalizeHex } from "@/lib/color/hex";

interface ColorFieldProps {
  label: string;
  /** Always a valid "#RRGGBB" color. */
  value: string;
  onChange: (hex: string) => void;
}

/**
 * A native color picker plus a hex field. The hex field keeps its own draft so
 * people can type freely. Only a valid color is passed up, so an unfinished
 * "#12" never changes the code, and on blur the field snaps back to the last
 * valid color.
 */
export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const invalid = normalizeHex(draft) === null;

  // Follow outside changes, like the native picker or loading a saved code.
  // Leave the draft alone when it already means the same color, otherwise
  // typing the short form "#abc" would be rewritten to "#AABBCC" under the cursor.
  useEffect(() => setDraft((current) => (normalizeHex(current) === value ? current : value)), [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className="text-[12.5px] font-medium text-muted">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-11 shrink-0 cursor-pointer"
        />
        <input
          id={`${id}-hex`}
          type="text"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(value)}
          className={`${controlClasses} h-11 min-w-0 flex-1 font-medium uppercase tabular-nums`}
        />
      </div>
      {invalid && (
        <InlineMessage id={`${id}-error`}>Use a hex color like #111113.</InlineMessage>
      )}
    </div>
  );
}
