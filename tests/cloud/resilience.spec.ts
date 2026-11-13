import { test, expect, openApp } from '../helpers';
import { mockCloud, OTHER_USER_ID, USER_ID } from './mocks';

test('guest write attempts require authentication without changing launch votes', async ({ page }) => {
  const cloud = await mockCloud(page);
  await openApp(page, `/launch/${OTHER_USER_ID}`);

  const vote = page.getByRole('button', { name: 'Upvote Mock cloud launch', exact: true });
  await expect(vote).toHaveAttribute('aria-pressed', 'false');
  await expect(vote).toContainText('0');
  await vote.click();

  await expect(page.getByRole('dialog', { name: 'Join Brunch' })).toBeVisible();
  await expect(vote).toHaveAttribute('aria-pressed', 'false');
  await expect(vote).toContainText('0');
  expect(cloud.calls.filter((call) => call.table === 'votes' && call.method !== 'GET')).toEqual([]);
});

test('rejected cloud votes remain unselected and preserve the displayed total', async ({ page }) => {
  const cloud = await mockCloud(page, { authenticated: true });
  await openApp(page, `/launch/${OTHER_USER_ID}`);

  const vote = page.getByRole('button', { name: 'Upvote Mock cloud launch', exact: true });
  await expect(vote).toBeVisible();
  cloud.failNext('votes', 'POST');
  await vote.click();

  await expect(page.getByRole('status')).toContainText('Vote not saved: mock POST failure');
  await expect(vote).toHaveAttribute('aria-pressed', 'false');
  await expect(vote).toContainText('0');
});

test('failed post and comment writes retain the user-entered text', async ({ page }) => {
  const cloud = await mockCloud(page, { authenticated: true });

  await openApp(page, '/posts/new?community=cloud_comm');
  await page.getByLabel('Title', { exact: true }).fill('Retain this draft');
  await page.getByLabel('Text (optional)').fill('The complete draft must survive a rejected insert.');
  cloud.failNext('posts', 'POST');
  await page.getByRole('button', { name: 'Post', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Post not published: mock POST failure');
  await expect(page).toHaveURL(/\/posts\/new\?community=cloud_comm$/);
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Retain this draft');
  await expect(page.getByLabel('Text (optional)')).toHaveValue('The complete draft must survive a rejected insert.');

  await openApp(page, `/launch/${OTHER_USER_ID}`);
  const feedback = page.getByLabel('Say something kind or useful');
  await feedback.fill('Retain this feedback after the server rejects it.');
  cloud.failNext('comments', 'POST');
  await page.getByRole('button', { name: 'Post', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Comment not posted: mock POST failure');
  await expect(feedback).toHaveValue('Retain this feedback after the server rejects it.');
  await expect(page.getByRole('main').locator('.cm').getByText('Retain this feedback after the server rejects it.', { exact: true })).toHaveCount(0);
});

test('zero-row owned launch deletes neither report success nor remove the launch', async ({ page }) => {
  const cloud = await mockCloud(page, { authenticated: true, ownedContent: true });
  await openApp(page, '/saved?sub=mine');
  await expect(page.getByText('Owned cloud launch', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Launch not deleted:');
  await expect(page.getByRole('status')).toContainText('no longer exists or you do not have permission');
  await expect(page).toHaveURL(/\/saved\?sub=mine$/);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Owned cloud launch', { exact: true })).toBeVisible();
  expect(cloud.calls.some((call) => call.table === 'launches' && call.method === 'DELETE')).toBe(true);
  expect(cloud.rows.launches.some((row) => row.id === USER_ID)).toBe(true);
});

test('initial cloud read failures are visible and retryable', async ({ page }) => {
  const cloud = await mockCloud(page);
  cloud.alwaysFail('launches', 'GET');
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Could not connect to Brunch' })).toBeVisible();
  await expect(page.getByText('mock GET failure', { exact: false })).toBeVisible();
  expect(page.locator('#main')).toHaveCount(0);

  cloud.clearFailure();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByText('Mock cloud launch', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Could not connect to Brunch' })).toHaveCount(0);
});
