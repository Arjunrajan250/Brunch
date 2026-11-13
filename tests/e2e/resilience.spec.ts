import { test, expect, openApp, STORAGE_KEY } from '../helpers';

test('profile settings and sample visibility survive reloads', async ({ page }) => {
  await openApp(page, '/me');
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByLabel('Name or team').fill('Reloadable Creator');
  await page.getByLabel('One line about you').fill('Local profile persistence test');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reloadable Creator', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Reloadable Creator', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Your name or team')).toHaveValue('Reloadable Creator');
  await page.getByLabel('Show sample listings (made up, for demo)').uncheck();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await openApp(page);
  await expect(page.locator('#main')).not.toContainText('Tidepool');
  await page.reload();
  await expect(page.locator('#main')).not.toContainText('Tidepool');
});

test('malformed persisted data is normalized without crashing the catalog', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      launches: [
        { id: 'partial', name: 'Partial but safe', url: 'https://example.com', plats: ['w', null, 7], tags: null, ts: 'invalid' },
        { id: null },
        null,
      ],
      comms: [null, { id: 7 }],
      posts: 'not-an-array',
      comments: { bad: 'not-an-array' },
      mine: { votes: 42, clicks: { partial: 'not-a-timestamp' }, views: { partial: 1 } },
      forum: { pv: { post: 'not-a-direction' } },
      makerName: null,
      recents: [null, 'safe'],
    }));
  }, STORAGE_KEY);
  await openApp(page);
  await expect(page.locator('#main')).not.toContainText('NaN');
  await expect.poll(() => page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    return state.launches?.[0]?.tags?.length === 0
      && state.launches?.[0]?.plats?.join(',') === 'w'
      && state.mine?.votes && Object.keys(state.mine.votes).length === 0;
  }, STORAGE_KEY)).toBe(true);
});

test('local storage quota failures remain visible and do not crash the app', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  await openApp(page);
  await expect(page.getByRole('status')).toContainText('Storage is full');
  await expect(page.locator('#main')).toBeVisible();
});

test('primary local routes fit a mobile viewport without document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/launch/s_tidepool', '/community', '/communities/new', '/submit', '/dashboard/s_tidepool?demo=1']) {
    await openApp(page, path);
    await expect.poll(() => page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth)).toBeLessThanOrEqual(1);
    if (path === '/submit') {
      await expect(page.getByRole('main').getByRole('button', { name: 'Next step', exact: true })).toBeVisible();
    }
  }
});
