import { Pill } from "@/components/ui/pill";
import { CONTENT_TYPES } from "@/lib/qr/content-types";
import type { ContentType } from "@/lib/qr/types";

interface ContentTabsProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
}

/** The six type pills. On phones the row scrolls sideways instead of wrapping. */
export function ContentTabs({ value, onChange }: ContentTabsProps) {
  return (
    <div
      role="group"
      aria-label="Content type"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CONTENT_TYPES.map((spec) => (
        <Pill key={spec.type} selected={value === spec.type} onClick={() => onChange(spec.type)}>
          {spec.label}
        </Pill>
      ))}
    </div>
  );
}
