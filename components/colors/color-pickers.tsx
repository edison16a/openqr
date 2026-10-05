import { InlineMessage } from "@/components/ui/text-input";
import { checkContrast, contrastMessage } from "@/lib/color/contrast";
import { ColorField } from "./color-field";

interface ColorPickersProps {
  fg: string;
  bg: string;
  onFg: (hex: string) => void;
  onBg: (hex: string) => void;
}

/** Code color and background, with a warning when the pair may not scan. */
export function ColorPickers({ fg, bg, onFg, onBg }: ColorPickersProps) {
  const warning = contrastMessage(checkContrast(fg, bg));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <ColorField label="Code color" value={fg} onChange={onFg} />
        <ColorField label="Background" value={bg} onChange={onBg} />
      </div>
      {warning && <InlineMessage>{warning}</InlineMessage>}
    </div>
  );
}
