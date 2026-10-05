import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { convertIcon, ICON_SIZE, isSafeSvg } from "@/lib/favicon/convert";
import { readIco } from "@/lib/favicon/ico";

const pngOf = (size: number, color = "#2B50FF") =>
  sharp({ create: { width: size, height: size, channels: 4, background: color } }).png().toBuffer();

/** Builds a one image ICO around a PNG, like modern favicon generators do. */
function icoAroundPng(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

/** Builds a 2x2 32 bit bitmap ICO, the old fashioned layout without a PNG inside. */
function icoWithBitmap(): Buffer {
  const dib = Buffer.alloc(40 + 2 * 2 * 4 + 2 * 4);
  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(2, 4);
  dib.writeInt32LE(4, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  // Four BGRA pixels, all opaque red.
  for (let i = 0; i < 4; i++) dib.set([0, 0, 255, 255], 40 + i * 4);
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(2, 6);
  header.writeUInt8(2, 7);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(dib.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, dib]);
}

describe("convertIcon", () => {
  it("re-encodes a raster image to a 256 px square PNG", async () => {
    const out = await convertIcon(await pngOf(64), "image/png");
    const meta = await sharp(out!.png).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["png", ICON_SIZE, ICON_SIZE]);
    expect(out!.sourceSize).toBe(64);
  });

  it("fits a wide image inside the square without stretching", async () => {
    const wide = await sharp({ create: { width: 100, height: 50, channels: 4, background: "#000" } }).png().toBuffer();
    const out = await convertIcon(wide, "image/png");
    const { data } = await sharp(out!.png).raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0); // top left corner is transparent padding
  });

  it("unpacks a PNG hidden inside an ICO", async () => {
    const out = await convertIcon(icoAroundPng(await pngOf(32), 32), "image/x-icon");
    expect(out?.sourceSize).toBe(32);
  });

  it("decodes an old style bitmap ICO", async () => {
    expect(readIco(icoWithBitmap())).toMatchObject({ kind: "raw", width: 2, height: 2 });
    const out = await convertIcon(icoWithBitmap(), "image/vnd.microsoft.icon");
    const { data } = await sharp(out!.png).raw().toBuffer({ resolveWithObject: true });
    expect(Array.from(data.subarray(0, 3))).toEqual([255, 0, 0]);
  });

  it("returns null for bytes that are not an image", async () => {
    expect(await convertIcon(Buffer.from("<html>nope</html>"), "image/png")).toBeNull();
  });

  it("rasterizes a plain SVG and rejects a hostile one", async () => {
    const good = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#2B50FF"/></svg>`;
    expect(await convertIcon(Buffer.from(good), "image/svg+xml")).not.toBeNull();
    const bad = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="file:///etc/passwd"/></svg>`;
    expect(isSafeSvg(bad)).toBe(false);
    expect(await convertIcon(Buffer.from(bad), "image/svg+xml")).toBeNull();
  });
});
