import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/sok', '/en', '/nn'];

test.describe('Accessibility tests (WCAG 2.1 AA)', () => {
  for (const url of PAGES) {
    test(`${url} has no critical accessibility violations`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});

test.describe('Landmark and structure', () => {
  test('all pages have valid landmarks', async ({ page }) => {
    for (const url of PAGES) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Must have at least one main landmark (Astro's dev toolbar may add others)
      const main = page.locator('main');
      expect(await main.count()).toBeGreaterThanOrEqual(1);

      // Header & footer rendered by @altinn/altinn-components Layout.
      // Use count rather than toBeVisible — altinn-components hydration leaves
      // the footer with visibility: hidden initially.
      expect(await page.locator('header').count()).toBeGreaterThanOrEqual(1);
      expect(await page.locator('footer').count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt may be empty (decorative) but must exist
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Skip link', () => {
  test('skip link targets main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // SiteLayout.tsx renders <SkipLink href="#main-content"> from designsystemet
    const skipLink = page.locator('a[href="#main-content"]');
    expect(await skipLink.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Keyboard navigation', () => {
  test('can navigate through main interactive elements with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const focusableElements: string[] = [];

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : null;
      });
      if (focused) {
        focusableElements.push(focused);
      }
    }

    expect(focusableElements.length).toBeGreaterThan(0);

    const hasInteractive =
      focusableElements.includes('a') ||
      focusableElements.includes('button') ||
      focusableElements.includes('input');
    expect(hasInteractive).toBe(true);
  });
});
