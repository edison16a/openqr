import { isIP } from "node:net";

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
/** Internal looking suffixes that should never be looked up from the public internet. */
const INTERNAL_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home", ".corp", ".intranet"];

/**
 * Checks the hostname the browser sent. Only syntax and obvious internal names
 * are rejected here. The real protection against private addresses happens
 * when the connection is made (see safe-fetch.ts), because a harmless looking
 * name can still resolve to a private IP.
 * Returns the lowercased host, or null when it must be refused.
 */
export function parseHostParam(raw: string | null): string | null {
  if (!raw) return null;
  const host = raw.trim().toLowerCase().replace(/\.$/, "");
  if (host.length === 0 || host.length > 253) return null;
  // IP literals (v4 or v6) are never a website's name, so refuse them outright.
  if (isIP(host) !== 0 || host.includes(":") || /^[\d.]+$/.test(host)) return null;
  if (host === "localhost" || INTERNAL_SUFFIXES.some((s) => host.endsWith(s))) return null;
  const labels = host.split(".");
  if (labels.length < 2) return null;
  return labels.every((label) => LABEL.test(label)) ? host : null;
}

/** Same checks for a URL found in a page or a redirect. Only http(s) on default ports. */
export function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.port !== "" && url.port !== "80" && url.port !== "443") return false;
  if (url.username || url.password) return false;
  return parseHostParam(url.hostname) !== null;
}
