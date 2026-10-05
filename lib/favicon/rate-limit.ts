const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

/**
 * A small sliding window limiter per client address. On serverless each
 * instance keeps its own counts, so this is a backstop, not the real wall.
 * The real limit is a Vercel Firewall rule, with CDN caching absorbing repeats.
 * Returns false when the caller should get a 429.
 */
export function allowRequest(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing forever on a long lived instance.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}
