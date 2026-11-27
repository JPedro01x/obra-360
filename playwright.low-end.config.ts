import { defineConfig } from '@playwright/test';

const port = 4179;
const buildDirectory = 'test-results/low-end-dist';

export default defineConfig({
  testDir: './tests/performance',
  testMatch: 'low-end-device.spec.ts',
  outputDir: './test-results/low-end-profile',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    channel: process.env.OBRA360_PERFORMANCE_BROWSER_CHANNEL,
    headless: true,
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
  },
  webServer: {
    command:
      `node node_modules/vite/bin/vite.js build --outDir ${buildDirectory} && ` +
      `node node_modules/vite/bin/vite.js preview --outDir ${buildDirectory} --host 127.0.0.1 --port ${port} --strictPort`,
    env: { VITE_USE_MOCK: 'false', VITE_API_URL: '/api', OBRA360_PROXY_TARGET: 'http://127.0.0.1:1' },
    port,
    reuseExistingServer: false,
    // The BIM worker bundle adds ~5 MB of worker assets; the production-like
    // build takes longer than Vite's default 120 s on slower pilot machines.
    timeout: 300000,
  },
});
