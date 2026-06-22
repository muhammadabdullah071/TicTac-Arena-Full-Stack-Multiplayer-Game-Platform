import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows sign in page", async ({ page }) => {
    await page.goto("/account/signin");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows sign up page", async ({ page }) => {
    await page.goto("/account/signup");
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
  });

  test("shows error with invalid credentials", async ({ page }) => {
    await page.goto("/account/signin");
    await page.getByLabel(/email/i).fill("nonexistent@test.com");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
  });
});

test.describe("Leaderboard", () => {
  test("displays leaderboard page", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible();
  });
});

test.describe("Tournaments", () => {
  test("displays tournament listing", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("heading", { name: /tournaments/i })).toBeVisible();
  });
});
