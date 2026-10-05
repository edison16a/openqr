import { expect, test } from "@playwright/test";
import fs from "node:fs";
import jsQR from "jsqr";
import sharp from "sharp";
import { enterLink, stubFavicon } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubFavicon(page, null);
});

test("starts empty, then shows a code as soon as a link is typed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Enter a link")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PNG" })).toBeDisabled();

  await enterLink(page, "example.com");
  await expect(page.getByRole("img", { name: "QR code for example.com" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PNG" })).toBeEnabled();
});

test("the downloaded PNG is 1024 px, well named, and decodes to the link", async ({ page }) => {
  await page.goto("/");
  await enterLink(page, "example.com");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PNG" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^openqr-example-com-\d{8}\.png$/);
  const path = await download.path();
  const { data, info } = await sharp(fs.readFileSync(path)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  expect([info.width, info.height]).toEqual([1024, 1024]);
  expect(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data).toBe("https://example.com");
});

test("shows a message for a bad link without breaking the page", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Link", { exact: true }).fill("not a link");
  await expect(page.getByText("Enter a valid link, like example.com.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PNG" })).toBeDisabled();
});

test("every content type produces a code", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByLabel("Text", { exact: true }).fill("Hello there");
  await expect(page.getByRole("img", { name: "QR code for Hello there" })).toBeVisible();

  await page.getByRole("button", { name: "Wi-Fi" }).click();
  await page.getByLabel("Network name").fill("HomeNetwork");
  await page.getByLabel("Password").fill("hunter2");
  const wifi = page.getByRole("img", { name: "QR code for HomeNetwork" });
  await expect(wifi).toBeVisible();
  // The password must never leak into a label.
  expect(await wifi.getAttribute("aria-label")).not.toContain("hunter2");

  await page.getByRole("button", { name: "Contact" }).click();
  await page.getByLabel("Name").fill("Ada Lovelace");
  await expect(page.getByRole("img", { name: "QR code for Ada Lovelace" })).toBeVisible();

  await page.getByRole("button", { name: "Email", exact: true }).click();
  await page.getByLabel("Address").fill("hi@example.com");
  await expect(page.getByRole("img", { name: "QR code for hi@example.com" })).toBeVisible();

  await page.getByRole("button", { name: "Phone" }).click();
  await page.getByLabel("Number").fill("+1 555 010 0199");
  await expect(page.getByRole("img", { name: "QR code for +15550100199" })).toBeVisible();
});

test("keeps typed values when switching between types", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Link", { exact: true }).fill("example.com");
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByLabel("Link", { exact: true })).toHaveValue("example.com");
});
