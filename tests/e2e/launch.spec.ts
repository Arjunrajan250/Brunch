import { test, expect, openApp, createLaunch, readLocalState, expectLocalState, RED_PIXEL } from '../helpers';

test('validates, uploads, creates, edits, shares and deletes a persisted launch', async ({ page }) => {
  await openApp(page, '/submit');
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByRole('main').getByText('Give it a name of at least 2 characters')).toBeVisible();

  const name = 'Persisted Playground';
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('One-line pitch').fill('A local project used to verify persistence and counters.');
  await page.getByLabel('Website or main link').fill('https://example.com/persisted-playground');
  const extraLink = page.getByPlaceholder('https://play.google.com/..., https://github.com/...');
  await extraLink.fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByRole('main').getByText('Every extra link must be a valid public web address')).toBeVisible();
  await extraLink.fill('github.com/example/persisted-playground');
  await page.getByRole('button', { name: 'Next step' }).click();

  const upload = page.getByRole('main').locator('input[type=file]').first();
  await upload.setInputFiles({ name: 'not-an-image.gif', mimeType: 'image/gif', buffer: RED_PIXEL });
  await expect(page.getByRole('status')).toContainText('Use a PNG, JPEG or WebP image.');
  await upload.setInputFiles([
    { name: 'one.png', mimeType: 'image/png', buffer: RED_PIXEL },
    { name: 'two.png', mimeType: 'image/png', buffer: RED_PIXEL },
    { name: 'three.png', mimeType: 'image/png', buffer: RED_PIXEL },
    { name: 'over-limit.png', mimeType: 'image/png', buffer: RED_PIXEL },
  ]);
  await expect(page.getByRole('main').locator('.thumb')).toHaveCount(3);
  await expect(page.getByRole('status')).toContainText('You can add 3 more screenshots');
  await page.getByRole('button', { name: 'Next step' }).click();

  const ownsProject = page.getByRole('checkbox');
  await ownsProject.uncheck();
  await page.getByLabel('Maker or team name').fill('Test Maker');
  await page.getByRole('main').getByRole('button', { name: 'Launch yours', exact: true }).click();
  await expect(page.getByRole('main').getByText('Please confirm you made this')).toBeVisible();
  await ownsProject.check();
  await page.getByRole('main').getByRole('button', { name: 'Launch yours', exact: true }).click();
  await expect(page).toHaveURL(/\/launch\/[^/]+$/);
  const id = decodeURIComponent(new URL(page.url()).pathname.split('/').pop()!);

  const upvote = page.getByRole('button', { name: `Upvote ${name}`, exact: true });
  await expect(upvote.locator('b')).toHaveText('0');
  await upvote.click();
  await expect(page.getByRole('button', { name: `Remove upvote from ${name}` }).locator('b')).toHaveText('1');
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await expectLocalState(page, (state) => Boolean(state.mine.votes[id]) && Boolean(state.mine.saves[id]));
  await page.reload();
  await expect(page.getByRole('button', { name: `Remove upvote from ${name}` }).locator('b')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: `Remove upvote from ${name}` }).click();
  await expect(page.getByRole('button', { name: `Upvote ${name}` }).locator('b')).toHaveText('0');

  await page.getByLabel('Say something kind or useful').fill('This comment must survive a reload.');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page.getByRole('main').getByText('This comment must survive a reload.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('main').getByText('This comment must survive a reload.')).toBeVisible();

  await page.getByRole('button', { name: 'View screenshot 1', exact: true }).click();
  const viewer = page.getByRole('dialog', { name: 'Screenshot viewer' });
  await expect(viewer).toContainText('1 / 3');
  await page.keyboard.press('ArrowRight');
  await expect(viewer).toContainText('2 / 3');
  await page.keyboard.press('ArrowLeft');
  await expect(viewer).toContainText('1 / 3');
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);

  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const share = page.getByRole('dialog', { name: `Share ${name}` });
  await expect(share.locator('input[readonly]')).toHaveValue(`http://127.0.0.1:3100/launch/${encodeURIComponent(id)}`);
  await share.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`http://127.0.0.1:3100/launch/${encodeURIComponent(id)}`);
  await share.getByRole('button', { name: 'Close share dialog' }).click();

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByRole('main').getByLabel('Name', { exact: true })).toHaveValue(name);
  await page.getByRole('main').getByLabel('One-line pitch').fill('An edited pitch that remains valid after the round trip.');
  await page.getByRole('main').locator('.lf-st').filter({ hasText: 'Launch' }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/launch/${id}$`));
  await expectLocalState(page, (state) => state.launches.some((launch) => launch.id === id
    && launch.tag === 'An edited pitch that remains valid after the round trip.'));
  await expect(page.getByRole('main').getByText('An edited pitch that remains valid after the round trip.')).toBeVisible();

  await openApp(page, '/saved?sub=mine');
  await expect(page.getByRole('main').getByText('1 viewers · 0 tried it · 0 upvotes')).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('main').getByText('You have not launched anything')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('main').getByText('You have not launched anything')).toBeVisible();
  const state = await readLocalState(page);
  expect(state).not.toBeNull();
  expect(state?.launches).toEqual([]);
  expect(Object.keys(state?.mine.votes || {})).not.toContain(id);
  expect(Object.keys(state?.mine.saves || {})).not.toContain(id);
});

test('new launches have no fabricated media and try/view flags contribute only one', async ({ page }) => {
  const id = await createLaunch(page, 'Honest Metrics');
  await expect(page.getByRole('main').getByText('No screenshots have been added.')).toBeVisible();
  await expect(page.getByRole('main').locator('.shotimg')).toHaveCount(0);
  await expectLocalState(page, (state) => state.mine.views[id] > 0);
  await openApp(page, '/saved?sub=mine');
  await expect(page.getByRole('main').getByText('1 viewers · 0 tried it · 0 upvotes')).toBeVisible();

  await page.context().route('https://example.com/**', (route) => route.fulfill({ body: '<title>External test page</title>' }));
  await openApp(page, `/launch/${id}`);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Try it', exact: true }).click();
  const popup = await popupPromise;
  await popup.close();
  await expectLocalState(page, (state) => state.mine.clicks[id] > 0);
  await openApp(page, `/launch/${id}`);
  await openApp(page, '/saved?sub=mine');
  await expect(page.getByRole('main').getByText('1 viewers · 1 tried it · 0 upvotes')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('main').getByText('1 viewers · 1 tried it · 0 upvotes')).toBeVisible();
});
