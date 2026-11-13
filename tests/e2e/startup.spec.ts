import { expect, test } from '@playwright/test';

test('hydrates the local app without browser exceptions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  const main = page.getByRole('main');
  await expect(main).toBeVisible();
  await expect(main).toHaveAttribute('id', 'main');
  await expect(page.getByRole('heading', { name: 'Made for fun. Found here.' })).toBeVisible();
  expect(errors).toEqual([]);
});
