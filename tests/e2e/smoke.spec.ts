import { expect, test } from '@playwright/test';

const ORIGIN = `http://127.0.0.1:${process.env.E2E_PORT ?? 3000}`;

const routes = [
  { path: '/', title: /Param Mehta/i },
  { path: '/resume/', title: /Resume/i },
  { path: '/articles/', title: /Articles/i },
  { path: '/experience/', title: /Experience/i },
  { path: '/skills/', title: /Skills/i },
  { path: '/experience/intuit/', title: /Intuit/i },
  { path: '/experience/rivian/', title: /Rivian/i },
  { path: '/experience/walmart/', title: /Walmart/i },
];

test.describe('static export smoke', () => {
  for (const { path, title } of routes) {
    test(`${path} loads without console or network errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', message => {
        if (message.type() !== 'error') return;
        // Analytics and Turnstile are unreachable from CI; their load failures
        // are noise, not a regression in the exported site.
        const source = message.location().url;
        if (source && !source.startsWith(ORIGIN)) return;
        consoleErrors.push(message.text());
      });
      page.on('response', response => {
        // Only our own assets: third-party analytics/captcha hosts are
        // unreachable in CI and are not what this suite is checking.
        const isOwnAsset = response.url().startsWith(ORIGIN);
        if (isOwnAsset && response.status() >= 400) {
          failedRequests.push(`${response.status()} ${response.url()}`);
        }
      });

      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole('main')).toBeVisible();
      expect(failedRequests).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }

  test('serves a 404 page for an unknown route', async ({ page }) => {
    await page.goto('/404/');
    await expect(page.getByRole('main')).toContainText('404');
  });

  test('exposes a sitemap and robots file', async ({ request }) => {
    expect((await request.get('/sitemap.xml')).status()).toBe(200);
    expect((await request.get('/robots.txt')).status()).toBe(200);
  });
});
