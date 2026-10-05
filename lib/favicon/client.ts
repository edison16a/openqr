/** A favicon the server found, already normalized to a 256 px PNG. */
export interface FaviconResult {
  blob: Blob;
  /** Size of the site's original icon. Small ones look soft once enlarged. */
  sourceSize: number;
}

/** Below this the icon is likely to look blurry in the middle of a code. */
export const SOFT_ICON_SIZE = 48;

/**
 * One lookup per host for the whole session. Storing the promise (not the
 * result) also merges two quick requests for the same host into one call.
 */
const cache = new Map<string, Promise<FaviconResult | null>>();

async function lookup(host: string): Promise<FaviconResult | null> {
  const res = await fetch(`/api/favicon?host=${encodeURIComponent(host)}`);
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`favicon lookup failed with ${res.status}`);
  const blob = await res.blob();
  if (blob.type !== "image/png") return null;
  return { blob, sourceSize: Number(res.headers.get("x-icon-source-size")) || 0 };
}

/**
 * Asks our server for a site's icon. Only the hostname is sent, never the
 * path or query string. A real "not found" is remembered, but a network error
 * or rate limit is not, so the next edit can try again.
 */
export function fetchFavicon(host: string): Promise<FaviconResult | null> {
  const cached = cache.get(host);
  if (cached) return cached;
  const request = lookup(host).catch(() => {
    cache.delete(host);
    return null;
  });
  cache.set(host, request);
  return request;
}
