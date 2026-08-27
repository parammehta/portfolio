import { expect, test } from '@playwright/test';

/**
 * The theme is resolved twice: once by the inline script in
 * `_document.page.tsx`, before the first paint, and again by React after mount.
 * Only this layer exercises the first one — it runs against the exported HTML
 * in a browser that actually has a colour-scheme preference to report.
 */
test.describe('theme', () => {
  test('follows the system preference on a first visit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      /242/
    );
  });

  test('resolves the theme before the page paints', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });

    // Sampled from the very first script the document runs, so this fails if
    // the theme is only applied once React has mounted — which is exactly the
    // flash of the wrong theme this script exists to prevent.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { themeAtLoad?: string }).themeAtLoad =
          document.body.dataset.theme;
      });
    });
    await page.goto('/');

    expect(
      await page.evaluate(
        () => (window as unknown as { themeAtLoad?: string }).themeAtLoad
      )
    ).toBe('light');
  });

  test('keeps an explicit choice over the system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.evaluate(() =>
      window.localStorage.setItem('themePreference', JSON.stringify('dark'))
    );
    await page.reload();

    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  });
});
