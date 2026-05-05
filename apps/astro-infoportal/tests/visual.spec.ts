import { test, expect } from '@playwright/test';

test.describe('Visual regression tests', () => {
  test.describe('Homepage', () => {
    test('full page screenshot - light mode', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('homepage-light.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Other pages', () => {
    test('search page', async ({ page }) => {
      await page.goto('/sok');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('search-page.png', {
        fullPage: true,
      });
    });

    test('English homepage', async ({ page }) => {
      await page.goto('/en');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('homepage-en.png', {
        fullPage: true,
      });
    });
  });
});

test.describe('Responsive layouts', () => {
  test('homepage at mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-mobile-375.png', {
      fullPage: true,
    });
  });

  test('homepage at tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-tablet-768.png', {
      fullPage: true,
    });
  });

});
