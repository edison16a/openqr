// Takes the README screenshots against a running app (default http://localhost:3000).
// Usage: npm run dev, then in another terminal: npm run screenshots
// Set PLAYWRIGHT_CHROMIUM_PATH to use a specific Chromium build.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "assets/screenshots";
fs.mkdirSync(OUT, { recursive: true });

/** The OpenQR mark as a 256 px PNG, standing in for a favicon so shots need no network. */
const logoPng = await sharp("assets/brand/logo.svg", { density: 600 }).resize(256, 256).png().toBuffer();

/** A plain rounded image for the Upload examples. */
const badge = (fill, glyph) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="56" fill="${fill}"/>${glyph}</svg>`,
    ),
  )
    .png()
    .toBuffer();

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.route("**/api/favicon*", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: logoPng, headers: { "x-icon-source-size": "256" } }),
  );
  return page;
}

/** Fills the generator and waits until the code is drawn and saved. */
async function makeCode(page, { type, fields, fg, bg, upload }) {
  await page.goto(`${BASE}/`);
  if (type) await page.getByRole("button", { name: type, exact: true }).click();
  for (const [label, value] of fields) await page.getByLabel(label, { exact: true }).fill(value);
  if (upload) {
    await page.getByLabel("Upload a center image").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: upload });
  }
  if (fg) await page.getByLabel("Code color", { exact: true }).fill(fg);
  if (bg) await page.getByLabel("Background", { exact: true }).fill(bg);
  await page.getByText("Saved", { exact: true }).waitFor();
  await page.waitForTimeout(400);
}

// Desktop generator with a favicon in the middle.
const desktop = await newPage({ width: 1440, height: 900 });
await desktop.goto(`${BASE}/`);
await desktop.getByLabel("Link", { exact: true }).fill("openqr.app");
await desktop.getByRole("button", { name: "Favicon", pressed: true }).waitFor();
await desktop.getByText("Saved", { exact: true }).waitFor();
await desktop.getByText("Saved", { exact: true }).waitFor({ state: "detached" });
await desktop.getByLabel("Link", { exact: true }).blur();
await desktop.screenshot({ path: `${OUT}/generator-desktop.png` });

// Mobile layout.
const mobile = await newPage({ width: 390, height: 844 });
await mobile.goto(`${BASE}/`);
await mobile.getByLabel("Link", { exact: true }).fill("openqr.app");
await mobile.getByRole("button", { name: "Favicon", pressed: true }).waitFor();
await mobile.getByText("Saved", { exact: true }).waitFor();
await mobile.getByText("Saved", { exact: true }).waitFor({ state: "detached" });
await mobile.getByLabel("Link", { exact: true }).blur();
await mobile.screenshot({ path: `${OUT}/generator-mobile.png`, fullPage: true });

// Saved codes, with a spread of types and colors. Colors here are just examples.
const saved = await newPage({ width: 1440, height: 900 });
await makeCode(saved, { fields: [["Link", "openqr.app"]] });
await makeCode(saved, {
  fields: [["Link", "example.com/menu"]],
  fg: "#2B50FF",
  bg: "#E9EDFF",
  upload: await badge("#2B50FF", '<circle cx="128" cy="128" r="52" fill="#fff"/>'),
});
await makeCode(saved, {
  type: "Wi-Fi",
  fields: [["Network name", "HomeNetwork"], ["Password", "correct horse"]],
  fg: "#1F6B4A",
  bg: "#F4EFE6",
});
await makeCode(saved, {
  fields: [["Link", "example.com/portfolio"]],
  fg: "#5B3A9E",
  bg: "#FFFFFF",
  upload: await badge("#5B3A9E", '<circle cx="128" cy="128" r="56" fill="none" stroke="#fff" stroke-width="22"/>'),
});
await saved.goto(`${BASE}/saved`);
await saved.getByRole("heading", { name: "example.com", level: 2 }).first().waitFor();
await saved.waitForTimeout(500);
await saved.screenshot({ path: `${OUT}/saved-codes.png` });

// Colors and contrast: the generator with custom colors and an uploaded image.
const custom = await newPage({ width: 1440, height: 900 });
await custom.goto(`${BASE}/`);
await custom.getByLabel("Link", { exact: true }).fill("example.com/menu");
await custom.getByLabel("Upload a center image").setInputFiles({
  name: "logo.png",
  mimeType: "image/png",
  buffer: await badge("#2B50FF", '<circle cx="128" cy="128" r="52" fill="#fff"/>'),
});
await custom.getByLabel("Code color", { exact: true }).fill("#2B50FF");
await custom.getByLabel("Background", { exact: true }).fill("#E9EDFF");
await custom.getByText("Saved", { exact: true }).waitFor();
await custom.getByText("Saved", { exact: true }).waitFor({ state: "detached" });
await custom.getByLabel("Background", { exact: true }).blur();
await custom.screenshot({ path: `${OUT}/generator-custom.png` });

await browser.close();
console.log(`Wrote screenshots to ${OUT}`);
