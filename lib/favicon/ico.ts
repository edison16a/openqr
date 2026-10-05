/** A decoded icon ready for sharp: either an embedded PNG or raw RGBA pixels. */
export type IcoImage =
  | { kind: "png"; data: Buffer; size: number }
  | { kind: "raw"; rgba: Buffer; width: number; height: number; size: number };

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/**
 * sharp cannot open .ico files, and /favicon.ico is the most common icon on
 * the web, so we unpack it ourselves. An ICO is a small directory of images;
 * each is either a whole PNG or a bitmap without a file header. We pick the
 * largest one. Returns null for layouts we do not understand.
 */
export function readIco(buf: Buffer): IcoImage | null {
  if (buf.length < 22 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return null;
  const count = buf.readUInt16LE(4);
  let best: { size: number; bytes: number; offset: number; bpp: number } | null = null;
  for (let i = 0; i < count; i++) {
    const at = 6 + i * 16;
    if (at + 16 > buf.length) break;
    const size = buf.readUInt8(at) || 256;
    const bpp = buf.readUInt16LE(at + 6);
    const entry = { size, bpp, bytes: buf.readUInt32LE(at + 8), offset: buf.readUInt32LE(at + 12) };
    if (!best || size > best.size || (size === best.size && bpp > best.bpp)) best = entry;
  }
  if (!best || best.offset + best.bytes > buf.length) return null;
  const data = buf.subarray(best.offset, best.offset + best.bytes);
  if (data.subarray(0, 4).equals(PNG_MAGIC)) return { kind: "png", data, size: best.size };
  return readDib(data, best.size);
}

/** Decodes a bitmap stored without a BMP file header, with its trailing AND mask. */
function readDib(data: Buffer, size: number): IcoImage | null {
  if (data.length < 40) return null;
  const headerSize = data.readUInt32LE(0);
  const width = data.readInt32LE(4);
  // Height counts the color bitmap and the mask together, hence the halving.
  const height = Math.abs(data.readInt32LE(8)) / 2;
  const bpp = data.readUInt16LE(14);
  if (data.readUInt32LE(16) !== 0 || width <= 0 || height <= 0 || width > 512 || height > 512) return null;
  if (![1, 4, 8, 24, 32].includes(bpp)) return null;

  const paletteSize = bpp <= 8 ? (data.readUInt32LE(32) || 1 << bpp) : 0;
  const paletteAt = headerSize;
  const pixelsAt = paletteAt + paletteSize * 4;
  const stride = Math.ceil((width * bpp) / 32) * 4;
  const maskAt = pixelsAt + stride * height;
  const maskStride = Math.ceil(width / 32) * 4;
  if (maskAt > data.length) return null;

  const rgba = Buffer.alloc(width * height * 4);
  let anyAlpha = false;
  for (let y = 0; y < height; y++) {
    const row = pixelsAt + (height - 1 - y) * stride;
    for (let x = 0; x < width; x++) {
      let b: number, g: number, r: number, a = 255;
      if (bpp >= 24) {
        const p = row + x * (bpp / 8);
        [b, g, r] = [data[p] ?? 0, data[p + 1] ?? 0, data[p + 2] ?? 0];
        if (bpp === 32) {
          a = data[p + 3] ?? 255;
          anyAlpha ||= a > 0;
        }
      } else {
        const bit = x * bpp;
        const byte = data[row + (bit >> 3)] ?? 0;
        const index = (byte >> (8 - bpp - (bit & 7))) & ((1 << bpp) - 1);
        const p = paletteAt + index * 4;
        [b, g, r] = [data[p] ?? 0, data[p + 1] ?? 0, data[p + 2] ?? 0];
      }
      // 32 bit icons carry real alpha. Everything else uses the AND mask.
      if (bpp !== 32) {
        const maskRow = maskAt + (height - 1 - y) * maskStride;
        const hidden = ((data[maskRow + (x >> 3)] ?? 0) >> (7 - (x & 7))) & 1;
        a = hidden ? 0 : 255;
      }
      rgba.set([r, g, b, a], (y * width + x) * 4);
    }
  }
  // Some 32 bit icons store all zero alpha and rely on the mask. Treat as opaque.
  if (bpp === 32 && !anyAlpha) for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
  return { kind: "raw", rgba, width, height, size };
}
