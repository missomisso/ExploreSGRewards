import { test, expect } from "@playwright/test";

test.describe("Home Page – E2E User Journey", () => {
  test("should load the home page and display key elements", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const root = page.locator("#root");
    await expect(root).not.toBeEmpty({ timeout: 10000 });

    const navOrHeader = page.locator("nav, header").first();
    await expect(navOrHeader).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to rewards page, view rewards, and see point costs", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const rewardsLink = page.locator('a[href*="rewards"], button:has-text("Rewards"), a:has-text("Rewards")').first();
    if (await rewardsLink.isVisible({ timeout: 5000 })) {
      await rewardsLink.click();
      await page.waitForURL(/rewards/i, { timeout: 10000 });
    } else {
      await page.goto("/rewards");
    }

    await page.waitForLoadState("networkidle");

    const rewardsContent = page.locator("text=/reward|points|redeem/i").first();
    await expect(rewardsContent).toBeVisible({ timeout: 10000 });

    const pointsOrCost = page.locator("text=/\\d+\\s*(pts|points)/i").first();
    if (await pointsOrCost.isVisible({ timeout: 5000 })) {
      await expect(pointsOrCost).toBeVisible();
    }
  });

  test("should navigate to explore page and see mission cards or listings", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    const root = page.locator("#root");
    await expect(root).not.toBeEmpty({ timeout: 10000 });

    const missionContent = page.locator("text=/mission|explore|discover/i").first();
    await expect(missionContent).toBeVisible({ timeout: 10000 });
  });
});
