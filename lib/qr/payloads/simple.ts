import { fail, type EncodeResult } from "../types";

/** Deliberately loose: one @, something on each side, a dot in the domain. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Keeps digits and a single leading plus. People paste numbers with spaces,
 * dashes and brackets, and tel: links work better without them. Returns null
 * when fewer than three digits remain.
 */
export function cleanPhone(value: string): string | null {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3) return null;
  return (trimmed.startsWith("+") ? "+" : "") + digits;
}

export function buildText(text: string): EncodeResult {
  if (!text.trim()) return fail();
  // The title is the first few words, so the Saved page stays readable.
  const words = text.trim().split(/\s+/).slice(0, 6).join(" ");
  return { ok: true, payload: text, title: words.length > 48 ? `${words.slice(0, 47)}…` : words };
}

export function buildEmail(address: string): EncodeResult {
  const value = address.trim();
  if (!value) return fail();
  if (!looksLikeEmail(value)) return fail("Enter a valid email address.");
  return { ok: true, payload: `mailto:${value}`, title: value };
}

export function buildPhone(number: string): EncodeResult {
  if (!number.trim()) return fail();
  const cleaned = cleanPhone(number);
  if (!cleaned) return fail("Enter a valid phone number.");
  return { ok: true, payload: `tel:${cleaned}`, title: cleaned };
}
