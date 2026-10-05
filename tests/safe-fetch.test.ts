import { beforeEach, describe, expect, it, vi } from "vitest";

// Pretend DNS says evil.example.com lives on loopback, to prove the connect
// time check catches names that look public but resolve to private space.
vi.mock("node:dns", () => {
  const lookup = vi.fn((host: string, _opts: unknown, cb: (...args: unknown[]) => void) => {
    cb(null, [{ address: host.startsWith("evil") ? "127.0.0.1" : "93.184.216.34", family: 4 }]);
  });
  return { default: { lookup }, lookup };
});

import { FetchRefused, safeFetch } from "@/lib/favicon/safe-fetch";

const options = { maxBytes: 1024, timeoutMs: 1000, acceptType: () => true };

beforeEach(() => vi.clearAllMocks());

describe("safeFetch", () => {
  it("refuses a hostname that resolves to a private address", async () => {
    await expect(safeFetch(new URL("http://evil.example.com/"), options)).rejects.toThrow();
  });

  it("refuses localhost and IP literals before any lookup", async () => {
    await expect(safeFetch(new URL("http://localhost/"), options)).rejects.toBeInstanceOf(FetchRefused);
    await expect(safeFetch(new URL("http://127.0.0.1/"), options)).rejects.toBeInstanceOf(FetchRefused);
    await expect(safeFetch(new URL("http://10.0.0.5/x"), options)).rejects.toBeInstanceOf(FetchRefused);
  });

  it("refuses non web schemes", async () => {
    await expect(safeFetch(new URL("file:///etc/passwd"), options)).rejects.toBeInstanceOf(FetchRefused);
  });
});
