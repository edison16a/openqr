/** One place an icon might live, with a rough guess at how big it is. */
export interface IconCandidate {
  url: URL;
  /** Largest side in pixels from the sizes attribute. Zero when unknown. */
  size: number;
  /** Apple touch icons are usually clean, large PNGs, so they win ties. */
  apple: boolean;
}

const MAX_CANDIDATES = 5;
/** Vector icons have no pixel size. Treat them as a good, not perfect, pick. */
const SVG_SIZE = 256;

/** Reads the attributes of one tag into a lowercase keyed map. */
function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([a-z][a-z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
  for (const match of tag.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (name && !(name in attrs)) attrs[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

/** Picks the biggest dimension out of a sizes attribute like "16x16 32x32". */
function parseSizes(sizes: string | undefined, href: string, type: string | undefined): number {
  const isSvg = type?.includes("svg") || /\.svg(\?|$)/i.test(href);
  const numbers = [...(sizes ?? "").matchAll(/(\d+)x(\d+)/gi)].map((m) => Math.max(Number(m[1]), Number(m[2])));
  if (numbers.length > 0) return Math.max(...numbers);
  return isSvg ? SVG_SIZE : 0;
}

/**
 * Collects icon links from a page's HTML and ranks them best first. A regex is
 * enough here: we only need the link tags in the head, and we cap the HTML we
 * read, so there is no need for a full parser. The classic /favicon.ico is
 * always added last as a fallback.
 */
export function findIconCandidates(html: string, base: URL): IconCandidate[] {
  const found = new Map<string, IconCandidate>();
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    const apple = rel.includes("apple-touch-icon") || rel.includes("apple-touch-icon-precomposed");
    if (!apple && !rel.includes("icon")) continue;
    const href = attrs.href?.trim();
    if (!href) continue;
    try {
      const url = new URL(href, base);
      if (!found.has(url.href)) {
        found.set(url.href, { url, size: parseSizes(attrs.sizes, href, attrs.type), apple });
      }
    } catch {
      // A broken href is just skipped, the fallback still applies.
    }
  }
  const ranked = [...found.values()].sort((a, b) => b.size - a.size || Number(b.apple) - Number(a.apple));
  const fallback = new URL("/favicon.ico", base);
  if (!found.has(fallback.href)) ranked.push({ url: fallback, size: 0, apple: false });
  return ranked.slice(0, MAX_CANDIDATES);
}
