import { normalizeHex } from "@/lib/color/hex";
import { CONTENT_TYPES, specFor } from "@/lib/qr/content-types";
import { encode } from "@/lib/qr/encode";
import { exceedsCapacity } from "@/lib/qr/limits";
import type { CenterKind, ContentType } from "@/lib/qr/types";
import { imageKeyFor } from "./save";
import type { SavedCode } from "./types";

const KINDS: CenterKind[] = ["favicon", "upload", "none"];
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

/**
 * Checks one record from an imported backup. A backup file is untrusted input,
 * so we rebuild everything we can instead of believing it: the payload and
 * title are re-encoded from the raw fields, colors are re-parsed, and the image
 * key is forced to the one we would have made. Returns null for anything off.
 */
export function parseSavedCode(value: unknown): SavedCode | null {
  if (!isObject(value)) return null;
  const { id, createdAt, updatedAt, type, fields, center, colors } = value;
  if (typeof id !== "string" || !/^qr_[a-z0-9]{3,16}$/.test(id)) return null;
  if (!isDate(createdAt) || !isDate(updatedAt)) return null;
  if (!CONTENT_TYPES.some((spec) => spec.type === type)) return null;
  const contentType = type as ContentType;
  const expected = specFor(contentType).fields.length;
  if (!Array.isArray(fields) || fields.length !== expected || !fields.every((f) => typeof f === "string")) {
    return null;
  }
  if (!isObject(center) || !KINDS.includes(center.kind as CenterKind)) return null;
  if (!isObject(colors) || typeof colors.fg !== "string" || typeof colors.bg !== "string") return null;
  const fg = normalizeHex(colors.fg);
  const bg = normalizeHex(colors.bg);
  const encoded = encode(contentType, fields as string[]);
  if (!fg || !bg || !encoded.ok || exceedsCapacity(encoded.payload)) return null;

  const kind = center.kind as CenterKind;
  return {
    id,
    createdAt,
    updatedAt,
    type: contentType,
    fields: fields as string[],
    payload: encoded.payload,
    title: encoded.title,
    center: {
      kind,
      host: kind === "favicon" && typeof center.host === "string" ? center.host.slice(0, 253) : undefined,
      imageKey: kind === "none" ? undefined : imageKeyFor(id),
    },
    colors: { fg, bg },
  };
}
