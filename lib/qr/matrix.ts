import QRCode from "qrcode";

/** A read only grid of modules. True means dark. */
export interface QrMatrix {
  /** Modules per side, not counting the quiet zone. */
  size: number;
  isDark(x: number, y: number): boolean;
}

/**
 * Builds the module matrix at error correction level H, the highest one.
 * We want raw modules (not a finished image) so our own renderer controls the
 * plate, colors and export, and so preview and PNG match exactly.
 * Level H is also what lets a logo cover part of the code and still scan.
 */
export function createMatrix(payload: string): QrMatrix {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: "H" });
  const size = modules.size;
  const data = modules.data;
  return {
    size,
    isDark: (x, y) => x >= 0 && y >= 0 && x < size && y < size && data[y * size + x] === 1,
  };
}
