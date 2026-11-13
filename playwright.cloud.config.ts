import { defineConfig } from '@playwright/test';

const port = 3101;

// This project never contacts a hosted Supabase project. Every REST response is
// supplied by tests/e2e-cloud fixtures and the public URL is a non-routable mock.
export default defineConfig({
  testDir: './tests/cloud',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  outputDir: './test-results/mocked-cloud',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `NEXT_PUBLIC_SUPABASE_URL=https://mock.test NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
