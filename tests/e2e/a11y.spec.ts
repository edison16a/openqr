import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { enterLink, samplePng, stubFavicon } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubFavicon(page, await samplePng());
});

/** WCAG A and AA rules, the bar the spec sets with a Lighthouse score of 95 or higher. */
const scan = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test("generator has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  expect((await scan(page)).violations).toEqual([]);
  await enterLink(page, "example.com");
  await expect(page.getByRole("button", { name: "Favicon", pressed: true })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test("every content type form has no violations", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Text", "Wi-Fi", "Contact", "Email", "Phone"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect((await scan(page)).violations, name).toEqual([]);
  }
});

test("saved codes page has no violations, empty and with a card", async ({ page }) => {
  await page.goto("/saved");
  await expect(page.getByText("Nothing saved yet")).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
  await page.goto("/");
  await enterLink(page, "example.com");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "example.com" })).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});
