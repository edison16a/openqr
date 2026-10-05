import { expect, test } from "@playwright/test";
import { enterLink, stubFavicon } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubFavicon(page, null);
  await page.goto("/");
  await enterLink(page, "example.com");
});

test("a valid hex changes the code and a half typed one keeps the last good color", async ({ page }) => {
  const code = page.getByLabel("Code color", { exact: true });
  await code.fill("#2B50FF");
  await expect(page.locator('svg[role="img"] path').first()).toHaveAttribute("fill", "#2B50FF");

  await code.fill("#12");
  await expect(page.getByText("Use a hex color like #111113.")).toBeVisible();
  await expect(page.locator('svg[role="img"] path').first()).toHaveAttribute("fill", "#2B50FF");

  await code.blur();
  await expect(code).toHaveValue("#2B50FF");
});

test("accepts the short hex form", async ({ page }) => {
  await page.getByLabel("Background", { exact: true }).fill("#fe0");
  await expect(page.locator('svg[role="img"] rect').first()).toHaveAttribute("fill", "#FFEE00");
});

test("warns for a light code on a dark ground and for low contrast", async ({ page }) => {
  await page.getByLabel("Code color", { exact: true }).fill("#FFFFFF");
  await page.getByLabel("Background", { exact: true }).fill("#111113");
  await expect(page.getByText(/lighter than the background/)).toBeVisible();

  await page.getByLabel("Code color", { exact: true }).fill("#BBBBBB");
  await page.getByLabel("Background", { exact: true }).fill("#FFFFFF");
  await expect(page.getByText(/Low contrast/)).toBeVisible();

  await page.getByLabel("Code color", { exact: true }).fill("#111113");
  await expect(page.getByText(/Low contrast|lighter than/)).toHaveCount(0);
});
