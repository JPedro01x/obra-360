import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: './test-results/ui',
  testDir: './tests/e2e',
  testMatch: 'workspace-real.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.OBRA360_CROSS_BROWSER === 'true'
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js build --outDir test-results/ui-dist && node node_modules/vite/bin/vite.js preview --outDir test-results/ui-dist --host 127.0.0.1 --port 4174 --strictPort',
    env: { OBRA360_PROXY_TARGET: 'http://127.0.0.1:1', VITE_USE_MOCK: 'false', VITE_API_URL: '/api' },
    port: 4174,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
