import { describe, expect, it } from "vitest";
import { findIconCandidates } from "@/lib/favicon/discover";

const base = new URL("https://example.com/blog/post");
const hrefs = (html: string) => findIconCandidates(html, base).map((c) => c.url.href);

describe("findIconCandidates", () => {
  it("picks the largest declared icon first", () => {
    const html = `
      <link rel="icon" href="/16.png" sizes="16x16">
      <link rel="icon" href="/64.png" sizes="64x64">
      <link rel="apple-touch-icon" href="/180.png" sizes="180x180">`;
    expect(hrefs(html)).toEqual([
      "https://example.com/180.png",
      "https://example.com/64.png",
      "https://example.com/16.png",
      "https://example.com/favicon.ico",
    ]);
  });

  it("handles shortcut icon, single quotes and unquoted attributes", () => {
    const html = `<link rel='shortcut icon' href=/a.ico><LINK REL="ICON" HREF="b.png">`;
    expect(hrefs(html)).toContain("https://example.com/a.ico");
    expect(hrefs(html)).toContain("https://example.com/blog/b.png");
  });

  it("resolves relative and protocol relative links against the page", () => {
    const html = `<link rel="icon" href="//cdn.example.net/i.png" sizes="32x32">`;
    expect(hrefs(html)[0]).toBe("https://cdn.example.net/i.png");
  });

  it("ignores unrelated links and mask icons", () => {
    const html = `<link rel="stylesheet" href="/a.css"><link rel="mask-icon" href="/m.svg">`;
    expect(hrefs(html)).toEqual(["https://example.com/favicon.ico"]);
  });

  it("falls back to /favicon.ico for pages with no icon tags", () => {
    expect(hrefs("<html></html>")).toEqual(["https://example.com/favicon.ico"]);
  });

  it("does not duplicate the fallback and caps the list", () => {
    const many = Array.from({ length: 10 }, (_, i) => `<link rel="icon" href="/i${i}.png" sizes="${i + 1}x${i + 1}">`);
    expect(findIconCandidates(many.join(""), base)).toHaveLength(5);
    expect(hrefs('<link rel="icon" href="/favicon.ico">')).toEqual(["https://example.com/favicon.ico"]);
  });
});
