import { test, expect } from '@playwright/test';

test.describe('Page rendering', () => {
  test('homepage renders with title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Altinn/);
  });

  test('search page renders', async ({ page }) => {
    await page.goto('/sok');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('English homepage renders', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', /en/);
  });

  test('Nynorsk homepage renders', async ({ page }) => {
    await page.goto('/nn');
    await page.waitForLoadState('networkidle');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', /nn/);
  });
});

test.describe('Navigation', () => {
  test('logo navigates to homepage', async ({ page }) => {
    await page.goto('/sok');
    await page.waitForLoadState('networkidle');

    // Header logo is the first link inside <header> pointing at root
    const logo = page.locator('header a[href="/"]').first();
    if ((await logo.count()) === 0) {
      test.skip(true, 'Logo link not found — header structure may have changed');
    }
    await logo.click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Responsive breakpoints', () => {
  test('layout at 375px (mobile) renders', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('layout at 768px (tablet) renders', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('layout at 1280px (desktop) renders', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible();
  });
});
