import type { Page } from "@playwright/test";
import sharp from "sharp";

/** A small solid PNG, used wherever a test needs a favicon or an upload. */
export function samplePng(color = "#2B50FF", size = 128): Promise<Buffer> {
  return sharp({ create: { width: size, height: size, channels: 4, background: color } }).png().toBuffer();
}

/** Types a link and waits for the preview to show a live code. */
export async function enterLink(page: Page, link: string) {
  await page.getByLabel("Link", { exact: true }).fill(link);
  await page.getByRole("img", { name: /^QR code for/ }).waitFor();
}

/** Stubs the favicon route so tests never touch the network. */
export async function stubFavicon(page: Page, png: Buffer | null, delayMs = 0) {
  await page.route("**/api/favicon*", async (route) => {
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (!png) return route.fulfill({ status: 404, json: { error: "not_found" } });
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      headers: { "x-icon-source-size": "128" },
      body: png,
    });
  });
}
