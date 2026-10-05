import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isAllowedUrl } from "./host";
import { isBlockedAddress } from "./ip-guard";

export interface SafeFetchOptions {
  /** Hard cap on the response body. The request is cut off past this. */
  maxBytes: number;
  /** Total time budget for the whole chain of redirects, in milliseconds. */
  timeoutMs?: number;
  maxRedirects?: number;
  /** Checked against the Content-Type header before any body is read. */
  acceptType: (contentType: string) => boolean;
}

export interface SafeFetchResult {
  /** The URL after redirects, so relative links resolve correctly. */
  url: URL;
  contentType: string;
  body: Buffer;
}

/** Thrown for anything we refuse or cannot fetch. The route turns these into a 404. */
export class FetchRefused extends Error {}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;

/**
 * DNS lookup that refuses private answers. Checking here, at connect time,
 * closes the gap where a hostname resolves to a public address for a pre-check
 * and then to 127.0.0.1 for the real connection (DNS rebinding).
 */
function guardedLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((entry) => isBlockedAddress(entry.address))) {
      return callback(new FetchRefused("blocked address") as NodeJS.ErrnoException, "", 0);
    }
    if (options.all) return callback(null, list);
    const first = list[0] as dns.LookupAddress;
    return callback(null, first.address, first.family);
  });
}

type LookupFn = NonNullable<http.RequestOptions["lookup"]>;

const HEADERS = {
  "user-agent": "OpenQR favicon lookup (+https://github.com/edison16a/openqr)",
  accept: "*/*",
  // Identity keeps the size cap honest, since we never inflate compressed bodies.
  "accept-encoding": "identity",
};

/** Performs one request without following redirects. */
function requestOnce(url: URL, signal: AbortSignal): Promise<http.IncomingMessage> {
  const transport = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup as LookupFn,
        signal,
        headers: HEADERS,
      },
      resolve,
    );
    req.on("error", reject);
    req.end();
  });
}
/** Reads a body, stopping the moment it grows past the limit. */
function readBody(res: http.IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    res.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        res.destroy();
        reject(new FetchRefused("response too large"));
        return;
      }
      chunks.push(chunk);
    });
    res.on("end", () => resolve(Buffer.concat(chunks)));
    res.on("error", reject);
    res.on("aborted", () => reject(new FetchRefused("aborted")));
  });
}

/**
 * Fetches a public URL with every guard the spec asks for: public hosts only,
 * a short timeout, at most three redirects (each one re-validated), a body
 * size cap and a content type check before reading the body.
 */
export async function safeFetch(start: URL, options: SafeFetchOptions): Promise<SafeFetchResult> {
  const { maxBytes, timeoutMs = 4000, maxRedirects = 3, acceptType } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let url = start;
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (!isAllowedUrl(url)) throw new FetchRefused("url not allowed");
      const res = await requestOnce(url, controller.signal);
      const status = res.statusCode ?? 0;
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        url = new URL(location, url);
        continue;
      }
      if (status !== 200) {
        res.resume();
        throw new FetchRefused(`status ${status}`);
      }
      const contentType = String(res.headers["content-type"] ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
      if (!acceptType(contentType)) {
        res.destroy();
        throw new FetchRefused("unexpected content type");
      }
      return { url, contentType, body: await readBody(res, maxBytes) };
    }
    throw new FetchRefused("too many redirects");
  } finally {
    clearTimeout(timer);
  }
}
