import { expect, test } from "@playwright/test";
import { enterLink, stubFavicon } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubFavicon(page, null);
});

/** Makes a code and waits for the autosave toast, which means it is stored. */
async function makeAndSave(page: import("@playwright/test").Page, link: string) {
  await page.goto("/");
  await enterLink(page, link);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
}

test("a code is saved automatically and survives a reload", async ({ page }) => {
  await makeAndSave(page, "example.com/menu");
  await page.reload();
  await page.getByRole("link", { name: "Saved codes" }).click();
  await expect(page.getByRole("heading", { name: "example.com" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "example.com" })).toBeVisible();
});

test("a blank form saves nothing", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.getByRole("link", { name: "Saved codes" }).click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
});

test("Edit restores the form and updates the same record", async ({ page }) => {
  await makeAndSave(page, "example.com/one");
  await page.goto("/saved");
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByLabel("Link", { exact: true })).toHaveValue("example.com/one");
  await page.getByLabel("Link", { exact: true }).fill("example.org/two");
  await page.waitForTimeout(1500);
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "example.org" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "example.com" })).toHaveCount(0);
});

test("Delete removes the card and Undo brings it back", async ({ page }) => {
  await makeAndSave(page, "example.com");
  await page.goto("/saved");
  await page.getByRole("button", { name: "Delete example.com" }).click();
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("heading", { name: "example.com" })).toBeVisible();
});

test("a saved Wi-Fi code never shows its password on the card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Wi-Fi" }).click();
  await page.getByLabel("Network name").fill("HomeNetwork");
  await page.getByLabel("Password").fill("hunter2");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "HomeNetwork" })).toBeVisible();
  expect(await page.content()).not.toContain("hunter2");
});

test("backup export contains the saved code", async ({ page }) => {
  await makeAndSave(page, "example.com");
  await page.goto("/saved");
  await page.getByRole("button", { name: "Backup options" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Export backup" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^openqr-backup-\d{8}\.json$/);
});
