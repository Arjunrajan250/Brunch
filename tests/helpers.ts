import { test as base, expect, type Page } from '@playwright/test';
import type { PersistedState } from '@/lib/storage';

export const STORAGE_KEY = 'kiosk.board.v3';
export { expect };

export const test = base.extend<{ noRuntimeErrors: void }>({
  noRuntimeErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await use();
    expect(errors, `Uncaught browser errors: ${errors.join('\n')}`).toEqual([]);
  }, { auto: true }],
});

export async function openApp(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.getByRole('main')).toBeVisible();
}

export async function readLocalState(page: Page): Promise<PersistedState | null> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null') as PersistedState | null, STORAGE_KEY);
}

export async function expectLocalState(page: Page, predicate: (state: PersistedState) => boolean) {
  await expect.poll(async () => {
    const state = await readLocalState(page);
    return state ? predicate(state) : false;
  }).toBe(true);
}

export async function createLaunch(page: Page, name = 'Persisted Playground') {
  await openApp(page, '/submit');
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('One-line pitch').fill('A local project used to verify persistence and counters.');
  await page.getByLabel('Website or main link').fill('https://example.com/persisted-playground');
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByRole('heading', { name: 'Make it stand out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(page.getByRole('heading', { name: 'Almost there', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/submit$/);
  expect((await readLocalState(page))?.launches.some((launch) => launch.name === name) || false).toBe(false);
  await page.getByLabel('Maker or team name').fill('Test Maker');
  await page.getByRole('main').getByRole('button', { name: 'Launch yours', exact: true }).click();
  await expect(page).toHaveURL(/\/launch\/[^/]+$/);
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  const id = decodeURIComponent(new URL(page.url()).pathname.split('/').pop()!);
  await expectLocalState(page, (state) => state.launches.some((launch) => launch.id === id));
  return id;
}

export async function createCommunity(page: Page, slug = 'regression_hq') {
  await openApp(page, '/communities/new');
  await page.getByLabel('Community name').fill(slug);
  await page.getByLabel('Title', { exact: true }).fill('Regression headquarters');
  await page.getByLabel('What is it about?').fill('A persisted community for end-to-end browser checks.');
  await page.getByRole('button', { name: 'Create community', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/b/c_${slug}$`));
  await expect(page.getByRole('main').getByRole('heading', { name: `b/${slug}`, exact: true })).toBeVisible();
  return `c_${slug}`;
}

export async function createPost(page: Page, title: string, communityId: string) {
  await openApp(page, `/posts/new?community=${encodeURIComponent(communityId)}`);
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Text (optional)').fill(`Body for ${title}`);
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/post\/[^/]+$/);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  const id = decodeURIComponent(new URL(page.url()).pathname.split('/').pop()!);
  await expectLocalState(page, (state) => state.posts.some((post) => post.id === id));
  return id;
}

// A valid image source; browsers resize it through the same production upload path.
export const RED_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
  'base64',
);
