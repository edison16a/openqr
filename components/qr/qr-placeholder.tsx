import { useMemo } from "react";
import { buildGeometry } from "@/lib/qr/geometry";
import { createMatrix } from "@/lib/qr/matrix";
import { QrSvg } from "./qr-svg";

/**
 * A soft, fake code shown before there is any content. It uses the divider
 * color so it reads as a placeholder and nobody tries to scan it. The hint
 * sits on a white pill in the middle.
 */
export function QrPlaceholder({ hint }: { hint: string }) {
  const geometry = useMemo(() => {
    const payload = "https://openqr.app/placeholder";
    return buildGeometry(createMatrix(payload), payload, false);
  }, []);
  return (
    <div className="relative size-full">
      <QrSvg geometry={geometry} fg="#E4E4DF" bg="#FFFFFF" label="" className="size-full" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <p className="rounded-full bg-surface px-4 py-2 text-center text-[14px] font-medium text-muted shadow-[0_0_0_1px_var(--color-line)]">
          {hint}
        </p>
      </div>
    </div>
  );
}
