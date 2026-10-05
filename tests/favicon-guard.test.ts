import { describe, expect, it } from "vitest";
import { isAllowedUrl, parseHostParam } from "@/lib/favicon/host";
import { isBlockedAddress } from "@/lib/favicon/ip-guard";

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:10.0.0.1",
    "not an ip",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});

describe("parseHostParam", () => {
  it("accepts ordinary hostnames and lowercases them", () => {
    expect(parseHostParam("Example.COM")).toBe("example.com");
    expect(parseHostParam("sub.my-site.co.uk.")).toBe("sub.my-site.co.uk");
  });

  it.each([
    null,
    "",
    "localhost",
    "foo.localhost",
    "printer.local",
    "db.internal",
    "127.0.0.1",
    "[::1]",
    "::1",
    "2130706433",
    "singlelabel",
    "bad_host.com",
    "has space.com",
    "a.com/path",
    "-bad.com",
  ])("rejects %s", (value) => {
    expect(parseHostParam(value)).toBeNull();
  });
});

describe("isAllowedUrl", () => {
  it("allows plain http and https", () => {
    expect(isAllowedUrl(new URL("https://example.com/icon.png"))).toBe(true);
    expect(isAllowedUrl(new URL("http://example.com/"))).toBe(true);
  });

  it("refuses other schemes, odd ports and credentials", () => {
    expect(isAllowedUrl(new URL("file:///etc/passwd"))).toBe(false);
    expect(isAllowedUrl(new URL("ftp://example.com/x"))).toBe(false);
    expect(isAllowedUrl(new URL("https://example.com:8443/x"))).toBe(false);
    expect(isAllowedUrl(new URL("https://user:pw@example.com/"))).toBe(false);
  });

  it("refuses redirects into private hostnames and IP literals", () => {
    expect(isAllowedUrl(new URL("http://localhost/"))).toBe(false);
    expect(isAllowedUrl(new URL("http://127.0.0.1/"))).toBe(false);
    expect(isAllowedUrl(new URL("http://169.254.169.254/latest/meta-data"))).toBe(false);
    expect(isAllowedUrl(new URL("http://[::1]/"))).toBe(false);
  });
});
