import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test('moves between routes via the navbar', async ({ page }) => {
    test.skip(
      test.info().project.name === 'mobile',
      'The navbar collapses behind a menu toggle on mobile; covered separately.'
    );

    await page.goto('/');

    await page.getByRole('navigation').getByRole('link', { name: 'Resume' }).click();
    await expect(page).toHaveURL(/\/resume\/?$/);

    await page.getByRole('navigation').getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
    await expect(page.getByLabel('Your Email')).toBeVisible();
  });

  test('opens and closes the mobile menu', async ({ page }) => {
    test.skip(
      test.info().project.name !== 'mobile',
      'Only the mobile project renders the menu toggle.'
    );

    await page.goto('/');

    const toggle = page.getByRole('button', { name: /menu/i });
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Contact' })
    ).toBeVisible();
  });

  // The whole point of the layout rework: these routes are sized to the
  // viewport, so the document itself must never grow a scrollbar. Nothing else
  // in the suite would catch a regression here, least of all on mobile.
  for (const path of ['/', '/experience/', '/skills/']) {
    test(`${path} fits the viewport without scrolling the document`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight
      );
      // A sub-pixel rounding difference is not a scrollbar.
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test('the navbar reaches the experience and skills routes', async ({ page }) => {
    test.skip(
      test.info().project.name === 'mobile',
      'The navbar collapses behind a menu toggle on mobile; covered separately.'
    );

    await page.goto('/');

    await page.getByRole('navigation').getByRole('link', { name: 'Experience' }).click();
    await expect(page).toHaveURL(/\/experience\/?$/);
    await expect(page.getByRole('tab', { name: 'Intuit' })).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Skills' }).click();
    await expect(page).toHaveURL(/\/skills\/?$/);
  });

  test('the skip link jumps to main content', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toHaveAttribute('href', '#MainContent');

    // It must be the first thing keyboard users reach, but the browser's own
    // chrome can absorb the very first Tab, so allow a couple of presses.
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      if (await skipLink.evaluate(el => el === document.activeElement)) break;
    }
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#MainContent$/);
  });

  test('the contact form rejects an empty submission', async ({ page }) => {
    await page.goto('/contact/');

    await page.getByRole('button', { name: /send message/i }).click();

    // Native constraint validation keeps us on the page with the form intact.
    await expect(page.getByLabel('Your Email')).toBeVisible();
    await expect(page).toHaveURL(/\/contact\/?$/);
  });
});
