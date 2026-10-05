import { fail, type EncodeResult } from "../types";
import { cleanPhone, looksLikeEmail } from "./simple";

/** vCard text values escape backslash, semicolon, comma and newlines. */
function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Splits "Ada King Lovelace" into family "Lovelace" and given "Ada King".
 * The N property is required by vCard 3.0 and some address books ignore FN.
 */
function splitName(name: string): { family: string; given: string } {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return { family: "", given: words[0] ?? "" };
  return { family: words[words.length - 1] ?? "", given: words.slice(0, -1).join(" ") };
}

/** Builds a vCard 3.0 contact. At least one field is required. */
export function buildVcard(name: string, phone: string, email: string): EncodeResult {
  const displayName = name.trim();
  const tel = cleanPhone(phone);
  const mail = email.trim();
  if (!displayName && !phone.trim() && !mail) return fail();
  if (phone.trim() && !tel) return fail("Enter a valid phone number.");
  if (mail && !looksLikeEmail(mail)) return fail("Enter a valid email address.");

  // FN is mandatory in vCard 3.0, so fall back to whatever else we have.
  const fn = displayName || tel || mail;
  const { family, given } = splitName(displayName || fn);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcard(family)};${escapeVcard(given)};;;`,
    `FN:${escapeVcard(fn)}`,
  ];
  if (tel) lines.push(`TEL;TYPE=CELL:${tel}`);
  if (mail) lines.push(`EMAIL:${escapeVcard(mail)}`);
  lines.push("END:VCARD");
  // The spec asks for CRLF line endings, and strict parsers rely on them.
  return { ok: true, payload: lines.join("\r\n"), title: fn };
}
