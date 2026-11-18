import { test, expect, openApp } from '../helpers';

test('header controls stay reachable on narrow phones', async ({ page }) => {
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 740 });
    await openApp(page);

    const profile = page.getByRole('button', { name: 'Your profile and settings' });
    await expect(profile).toBeVisible();
    const box = await profile.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);

    const overflow = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('authentication and creation dialogs fit small screens and close with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openApp(page);

  await page.getByRole('button', { name: 'Your profile and settings' }).click();
  const auth = page.getByRole('dialog', { name: 'Join Brunch' });
  await expect(auth).toBeVisible();
  await auth.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(auth.getByLabel('Your Name')).toBeVisible();
  await expect(auth.getByLabel('Email address')).toBeVisible();
  await expect(auth.getByLabel('Password', { exact: true })).toBeVisible();
  expect(await auth.locator(':scope > div').evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
  })).toBe(true);
  await page.keyboard.press('Escape');
  await expect(auth).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

  await page.getByRole('button', { name: 'Create something new' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('chat stays above navigation and remains usable across breakpoints', async ({ page }) => {
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 840, height: 600 }]) {
    await page.setViewportSize(size);
    await openApp(page, '/chat?community=c_gamedev');

    const chat = page.locator('.mchat');
    await expect(chat).toHaveCSS('transform', 'none');
    const box = await chat.boundingBox();
    expect(box).not.toBeNull();
    const reservedBottom = size.width < 840 ? 90 : 18;
    expect(box!.y + box!.height).toBeLessThanOrEqual(size.height - reservedBottom + 1);

    const join = page.getByRole('button', { name: 'Join community', exact: true });
    if (await join.isVisible()) await join.click();
    const composer = page.getByRole('textbox', { name: 'Message #general' });
    await expect(composer).toBeEnabled();
    const composerBox = await composer.boundingBox();
    expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(size.height - reservedBottom + 1);
    await composer.fill(`Responsive message ${size.width}`);
    await composer.press('Enter');
    await expect(page.getByRole('log')).toContainText(`Responsive message ${size.width}`);

  }
});

test('compact rail launch action fits without clipping its contents', async ({ page }) => {
  for (const width of [840, 1000, 1199]) {
    await page.setViewportSize({ width, height: 900 });
    await openApp(page);

    const rail = page.getByRole('complementary', { name: 'Primary' });
    const launch = rail.getByRole('button', { name: 'Launch yours' });
    await expect(launch).toBeVisible();
    expect(await rail.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await launch.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await launch.click();
    await expect(page).toHaveURL(/\/submit$/);
  }
});
