import { convertIcon, type ConvertedIcon } from "./convert";
import { findIconCandidates } from "./discover";
import { safeFetch } from "./safe-fetch";

const HTML_LIMIT = 512 * 1024;
const IMAGE_LIMIT = 1024 * 1024;
/** Stop trying candidates after this long, so one slow site cannot hold the route open. */
const BUDGET_MS = 9000;
const FETCH_TIMEOUT_MS = 4000;

const isHtml = (type: string) => type === "" || type.includes("html");
const isImage = (type: string) => type.startsWith("image/") || type === "application/octet-stream" || type === "";

/** Gets the homepage and returns the icon links it declares, or just the default path. */
async function candidatesFor(host: string, timeoutMs: number) {
  for (const scheme of ["https", "http"]) {
    try {
      const page = await safeFetch(new URL(`${scheme}://${host}/`), {
        maxBytes: HTML_LIMIT,
        timeoutMs,
        truncate: true,
        acceptType: isHtml,
      });
      return findIconCandidates(page.body.toString("utf8"), page.url);
    } catch {
      // Try the next scheme, then fall back to the default icon path below.
    }
  }
  return findIconCandidates("", new URL(`https://${host}/`));
}

/**
 * Finds a site's icon and returns it as a 256 px PNG. Tries the declared icons
 * from largest to smallest, then /favicon.ico. Every request goes through
 * safeFetch, so private addresses and oversized responses are refused.
 */
export async function findFavicon(host: string): Promise<ConvertedIcon | null> {
  const deadline = Date.now() + BUDGET_MS;
  const left = () => Math.min(FETCH_TIMEOUT_MS, deadline - Date.now());
  const candidates = await candidatesFor(host, left());
  for (const candidate of candidates) {
    if (left() <= 0) break;
    try {
      const image = await safeFetch(candidate.url, {
        maxBytes: IMAGE_LIMIT,
        timeoutMs: left(),
        acceptType: isImage,
      });
      const icon = await convertIcon(image.body, image.contentType);
      if (icon) return icon;
    } catch {
      // This candidate failed. Move on to the next one.
    }
  }
  return null;
}
