import { test, expect, openApp } from '../helpers';

test('launch, post, community, creator, dashboard and collection routes are directly loadable', async ({ page }) => {
  const cases = [
    ['/launch/s_tidepool', 'Tidepool'],
    ['/post/sp_0', 'What did you cut from your jam game at the last minute?'],
    ['/b/gamedev', 'b/gamedev'],
    ['/u/s%3Amara', 'Mara Okafor'],
    ['/dashboard/s_tidepool?demo=1&metric=votes&days=7', 'Sample data.'],
    ['/collection?title=Weekend+projects&ids=s_tidepool%2Cs_lumen&rank=1', 'Weekend projects'],
  ] as const;

  for (const [path, content] of cases) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('main')).toContainText(content);
  }

  await openApp(page, '/dashboard/s_tidepool?demo=1&metric=votes&days=7');
  await expect(page.getByRole('button', { name: 'Upvotes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '7 days', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '30 days', exact: true }).click();
  await expect(page).toHaveURL(/days=30/);
});

test('legacy links and browser back/forward retain the selected item', async ({ page }) => {
  await openApp(page, '/?launch=s_tidepool');
  await expect(page.getByRole('heading', { name: 'Tidepool', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'cozy', exact: true }).click();
  await expect(page).toHaveURL(/\/collection\?/);
  await expect(page.getByRole('main')).toContainText('#cozy');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Tidepool', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('main')).toContainText('#cozy');

  await page.goto('/#u/s:mara');
  await expect(page).toHaveURL(/\/u\/s%3Amara$/);
  await expect(page.getByRole('heading', { name: 'Mara Okafor', exact: true })).toBeVisible();
});

test('notifications are empty and reports never claim unsupported moderator delivery', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('No notifications yet');
  await expect(page.getByRole('dialog')).not.toContainText('Someone upvoted your launch');
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  await openApp(page, '/launch/s_tidepool');
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('No report has been submitted from this screen.');
  await page.getByRole('button', { name: 'Copy item link' }).click();
  await expect(page.getByRole('status')).toContainText('No report was submitted');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('http://127.0.0.1:3100/launch/s_tidepool');
});
