import { test, expect } from '@playwright/test';

type RouteExpectation = {
  path: string;
  expectedStatus: number;
};

// Well-known altinn-infoportal routes. Catch-all `[...slug].astro` resolves
// the rest from Umbraco; covering every CMS-managed slug is out of scope.
const ROUTES: RouteExpectation[] = [
  { path: '/', expectedStatus: 200 },
  { path: '/sok', expectedStatus: 200 },
  { path: '/en', expectedStatus: 200 },
  { path: '/en/search', expectedStatus: 200 },
  { path: '/nn', expectedStatus: 200 },
  { path: '/nn/sok', expectedStatus: 200 },
  { path: '/__does_not_exist__', expectedStatus: 404 },
];

test.describe('Route smoke tests', () => {
  test('all documented routes respond as expected', async ({ page, baseURL }) => {
    expect(baseURL, 'baseURL must be set (e.g. http://localhost:4321)').toBeTruthy();

    const failures: Array<{ path: string; status: number | null; expected: number }> = [];

    for (const route of ROUTES) {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      const status = response ? response.status() : null;

      if (status !== route.expectedStatus) {
        failures.push({ path: route.path, status, expected: route.expectedStatus });
      }
    }

    expect(failures, `Route smoke failures:\n${JSON.stringify(failures, null, 2)}`).toEqual([]);
  });
});
