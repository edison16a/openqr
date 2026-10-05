import { expect, test } from "@playwright/test";
import { enterLink, samplePng, stubFavicon } from "./helpers";

const logoInCode = (page: import("@playwright/test").Page) => page.locator('svg[role="img"] image');

test.describe("upload", () => {
  test.beforeEach(async ({ page }) => {
    await stubFavicon(page, null);
    await page.goto("/");
    await enterLink(page, "example.com");
  });

  test("an uploaded image lands in the center, and can be replaced or removed", async ({ page }) => {
    await expect(logoInCode(page)).toHaveCount(0);
    await page.getByLabel("Upload a center image").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: await samplePng(),
    });
    await expect(logoInCode(page)).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Upload", pressed: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Replace image" })).toBeVisible();

    await page.getByRole("button", { name: "Remove image" }).click();
    await expect(logoInCode(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "None", pressed: true })).toBeVisible();
  });

  test("None clears the logo and Upload brings it back without picking again", async ({ page }) => {
    await page.getByLabel("Upload a center image").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: await samplePng(),
    });
    await expect(logoInCode(page)).toHaveCount(1);
    await page.getByRole("button", { name: "None" }).click();
    await expect(logoInCode(page)).toHaveCount(0);
    await page.getByRole("button", { name: /Upload$/ }).click();
    await expect(logoInCode(page)).toHaveCount(1);
  });

  test("rejects the wrong type and keeps the earlier choice", async ({ page }) => {
    await page.getByLabel("Upload a center image").setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    await expect(page.getByText("Use a PNG, JPG, WebP or SVG image.")).toBeVisible();
    await expect(page.getByRole("button", { name: "None", pressed: true })).toBeVisible();
  });

  test("rejects a file over 5 MB", async ({ page }) => {
    await page.getByLabel("Upload a center image").setInputFiles({
      name: "big.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByText(/over 5 MB/)).toBeVisible();
  });
});

test.describe("favicon", () => {
  test("is found, auto-selected, and drawn in the center", async ({ page }) => {
    await stubFavicon(page, await samplePng());
    await page.goto("/");
    await page.getByLabel("Link", { exact: true }).fill("example.com");
    await expect(page.getByRole("button", { name: "Favicon", pressed: true })).toBeVisible();
    await expect(logoInCode(page)).toHaveCount(1);
  });

  test("an explicit None choice is never overridden by a late favicon", async ({ page }) => {
    await stubFavicon(page, await samplePng(), 1500);
    await page.goto("/");
    await page.getByLabel("Link", { exact: true }).fill("example.com");
    await page.getByRole("button", { name: "None" }).click();
    await expect(page.getByRole("button", { name: "Favicon" })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("button", { name: "Favicon" })).not.toHaveAttribute("aria-disabled", "true", {
      timeout: 6000,
    });
    await expect(page.getByRole("button", { name: "None", pressed: true })).toBeVisible();
    await expect(logoInCode(page)).toHaveCount(0);
  });

  test("a missing favicon disables the tile and explains why in a tooltip", async ({ page }) => {
    await stubFavicon(page, null);
    await page.goto("/");
    await page.getByLabel("Link", { exact: true }).fill("example.com");
    const tile = page.getByRole("button", { name: "Favicon" });
    await expect(tile).toHaveAttribute("aria-disabled", "true");
    await tile.focus();
    await expect(page.getByRole("tooltip").filter({ hasText: "No favicon found for example.com." })).toBeVisible();
  });

  test("is unavailable for non link content", async ({ page }) => {
    await stubFavicon(page, await samplePng());
    await page.goto("/");
    await page.getByRole("button", { name: "Text", exact: true }).click();
    await expect(page.getByRole("button", { name: "Favicon" })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: "Favicon" }).focus();
    await expect(page.getByRole("tooltip").filter({ hasText: "Favicons are available for links." })).toBeVisible();
  });

  test("only the hostname is sent to the server", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (req) => req.url().includes("/api/favicon") && urls.push(req.url()));
    await stubFavicon(page, await samplePng());
    await page.goto("/");
    await page.getByLabel("Link", { exact: true }).fill("https://example.com/private/path?token=secret");
    await expect(page.getByRole("button", { name: "Favicon", pressed: true })).toBeVisible();
    expect(urls).toHaveLength(1);
    expect(new URL(urls[0]!).search).toBe("?host=example.com");
  });
});
