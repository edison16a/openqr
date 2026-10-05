import { fail, type EncodeResult } from "../types";

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Adds https:// when the user left the scheme off, and checks the result is a
 * real http(s) address. Returns the string exactly as typed plus the prefix,
 * not a re-serialized URL, so "openqr.app" does not grow a trailing slash.
 */
export function normalizeLink(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // A bare word like "https://openq" parses fine but is almost always a
    // half typed link, so wait for a dot (or localhost) before showing a code.
    const host = url.hostname;
    if (!host.includes(".") && host !== "localhost") return null;
    return candidate;
  } catch {
    return null;
  }
}

/** Returns just the hostname of a link field, or null when it is not valid yet. */
export function hostOf(input: string): string | null {
  const link = normalizeLink(input);
  return link ? new URL(link).hostname.replace(/^www\./, "") : null;
}

export function buildLink(url: string): EncodeResult {
  if (!url.trim()) return fail();
  const link = normalizeLink(url);
  if (!link) return fail("Enter a valid link, like example.com.");
  return { ok: true, payload: link, title: hostOf(url) ?? link };
}
