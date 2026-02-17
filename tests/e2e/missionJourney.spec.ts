/**
 * Part C: E2E Test — Mission Browsing User Journey
 *
 * Uses Playwright to automate a real browser and test the
 * tourist experience: landing on the home page, navigating
 * to the explore page, and viewing a mission detail page.
 *
 * Pre-requisite: The app must be running on http://localhost:5000
 *   Start it with: npm run dev
 *
 * Run this test with:
 *   npx playwright test tests/e2e/missionJourney.spec.ts
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5000";

test.describe("Mission Browsing Journey", () => {

  test("User can view the home page and see the hero section", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator('[data-testid="button-start-exploring"]')).toBeVisible();

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("User can navigate to the Explore page and see mission cards", async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);

    await page.waitForSelector('[data-testid^="mission-card-"]', { timeout: 10000 });

    const missionCards = page.locator('[data-testid^="mission-card-"]');
    const count = await missionCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("User can click a mission card and see the mission detail page", async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);

    await page.waitForSelector('[data-testid^="mission-card-"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid^="mission-card-"]').first();
    await firstCard.click();

    await page.waitForURL(/\/mission\//, { timeout: 10000 });

    const title = page.locator("h1, h2").first();
    await expect(title).toBeVisible();
  });

  test("Mission detail page displays title and sign-in prompt for unauthenticated users", async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);

    await page.waitForSelector('[data-testid^="mission-card-"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid^="mission-card-"]').first();
    await firstCard.click();

    await page.waitForURL(/\/mission\//, { timeout: 10000 });

    const title = page.locator("h1").first();
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).not.toBeEmpty();

    await expect(page.locator('[data-testid="button-login-to-start"]')).toBeVisible({ timeout: 10000 });
  });
});
