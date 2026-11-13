import { test, expect, openApp, createCommunity, createPost, expectLocalState } from '../helpers';

test('community and post CRUD persists, votes exactly once, sorts consistently and shares canonical URLs', async ({ page }) => {
  const main = page.getByRole('main');
  await openApp(page, '/communities/new');
  await page.getByLabel('Community name').fill('gamedev');
  await page.getByLabel('Title', { exact: true }).fill('Duplicate community');
  await page.getByLabel('What is it about?').fill('This deliberately uses the bundled sample slug.');
  await page.getByRole('button', { name: 'Create community', exact: true }).click();
  await expect(page.getByText('That name is taken. Try another')).toBeVisible();

  const communityId = await createCommunity(page, 'regression_hq');
  await expect(page.getByRole('button', { name: 'Joined', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(main.getByRole('complementary', { name: 'About this community' }).getByText(/1 members · 0 posts/)).toBeVisible();
  await expectLocalState(page, (state) => state.forum.joined[communityId] > 0);

  const olderId = await createPost(page, 'Older voted post', communityId);
  await createPost(page, 'Newest unvoted post', communityId);
  await openApp(page, `/b/${communityId}`);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect.poll(() => main.locator('article.post h3').allTextContents()).toEqual(['Newest unvoted post', 'Older voted post']);
  const older = main.locator('article.post').filter({ hasText: 'Older voted post' });
  await older.getByRole('button', { name: 'Upvote', exact: true }).click();
  await expect(older.getByRole('group', { name: 'Vote' })).toContainText('1');
  await older.getByRole('button', { name: 'Upvote', exact: true }).click();
  await expect(older.getByRole('group', { name: 'Vote' })).toContainText('0');
  await older.getByRole('button', { name: 'Upvote', exact: true }).click();
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await expect.poll(() => main.locator('article.post h3').allTextContents()).toEqual(['Older voted post', 'Newest unvoted post']);
  await openApp(page, `/post/${olderId}`);
  await expect(page.getByRole('group', { name: 'Vote' })).toContainText('1');

  await page.getByLabel('Add a comment').fill('A useful threaded comment.');
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(main.getByText('A useful threaded comment.')).toBeVisible();
  await page.reload();
  await expect(main.getByText('A useful threaded comment.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Vote' })).toContainText('1');

  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Post link copied');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(`http://127.0.0.1:3100/post/${olderId}`);

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page).toHaveURL(/\/community$/);
  await openApp(page, `/post/${olderId}`);
  await expect(main.getByText('This post is gone')).toBeVisible();
  await expectLocalState(page, (state) => !state.posts.some((post) => post.id === olderId)
    && !state.comments[`post:${olderId}`]
    && state.forum.pv[olderId] === undefined);
});

test('clipboard denial is reported without false sharing success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } },
    });
    document.execCommand = () => false;
  });
  await openApp(page, '/post/sp_0');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Could not copy the link');
  await expect(page.getByRole('status')).not.toContainText('Post link copied');
});
