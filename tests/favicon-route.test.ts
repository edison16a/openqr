import { beforeEach, describe, expect, it, vi } from "vitest";

const findFavicon = vi.fn();
vi.mock("@/lib/favicon/server", () => ({ findFavicon: (host: string) => findFavicon(host) }));

import { GET } from "@/app/api/favicon/route";

const call = (query: string, ip = "203.0.113.9") =>
  GET(new Request(`http://localhost/api/favicon${query}`, { headers: { "x-forwarded-for": ip } }));

beforeEach(() => findFavicon.mockReset());

describe("GET /api/favicon", () => {
  it("returns 400 for a missing or private host and never looks anything up", async () => {
    expect((await call("")).status).toBe(400);
    expect((await call("?host=localhost")).status).toBe(400);
    expect((await call("?host=169.254.169.254")).status).toBe(400);
    expect(findFavicon).not.toHaveBeenCalled();
  });

  it("returns a cacheable PNG when an icon is found", async () => {
    findFavicon.mockResolvedValue({ png: Buffer.from([1, 2, 3]), sourceSize: 32 });
    const res = await call("?host=example.com");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("s-maxage=86400");
    expect(res.headers.get("x-icon-source-size")).toBe("32");
  });

  it("returns 404 with a JSON error when nothing is found", async () => {
    findFavicon.mockResolvedValue(null);
    const res = await call("?host=nothing.example");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("returns 429 after too many requests from one client", async () => {
    findFavicon.mockResolvedValue(null);
    let last = 0;
    for (let i = 0; i < 31; i++) last = (await call("?host=example.com", "198.51.100.77")).status;
    expect(last).toBe(429);
  });
});
