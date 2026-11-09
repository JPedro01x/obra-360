import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  outputDir: './test-results/integrated',
  testDir: './tests/integrated',
  fullyParallel: false,
  workers: 1,
  timeout: 180000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    headless: true,
    trace: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/integrated-server.mjs',
    url: 'http://127.0.0.1:4175/api/v1/instalacao',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
