import { parseHostParam } from "@/lib/favicon/host";
import { allowRequest } from "@/lib/favicon/rate-limit";
import { findFavicon } from "@/lib/favicon/server";

// sharp and node:dns need the Node runtime, not the edge runtime.
export const runtime = "nodejs";
export const maxDuration = 15;

const ICON_CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";
/** Misses are cached briefly so repeated lookups for a bad host stay cheap. */
const MISS_CACHE = "public, s-maxage=600";

/** Pulls the first address out of x-forwarded-for, the way Vercel sets it. */
function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * GET /api/favicon?host=example.com
 * The browser sends only a hostname. Paths and query strings never leave it.
 * Nothing about the request is logged.
 */
export async function GET(request: Request): Promise<Response> {
  const host = parseHostParam(new URL(request.url).searchParams.get("host"));
  if (!host) return Response.json({ error: "bad_host" }, { status: 400 });

  if (!allowRequest(clientKey(request))) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const icon = await findFavicon(host);
  if (!icon) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": MISS_CACHE } });
  }
  return new Response(new Uint8Array(icon.png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": ICON_CACHE,
      // Lets the UI warn when the original was tiny and will look soft.
      "X-Icon-Source-Size": String(icon.sourceSize),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
