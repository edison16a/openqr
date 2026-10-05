import { expect, test } from "@playwright/test";
import { enterLink, stubFavicon } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubFavicon(page, null);
});

for (const path of ["/", "/saved"]) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path === "/") await enterLink(page, "example.com");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("loads no third party scripts or requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (!["localhost", ""].includes(url.hostname) && url.protocol.startsWith("http")) external.push(req.url());
  });
  await page.goto("/");
  await enterLink(page, "example.com");
  expect(external).toEqual([]);
});

test("the GitHub link opens the repository", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "View on GitHub" });
  await expect(link).toHaveAttribute("href", "https://github.com/edison16a/openqr");
  await expect(link.locator("svg")).toBeVisible();
});

test("keyboard only: pills and tiles are real buttons with pressed state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Link", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Text", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Text", exact: true })).toHaveAttribute("aria-pressed", "true");
});
