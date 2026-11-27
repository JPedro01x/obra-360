import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'ifc-geometry.spec.ts',
  outputDir: './test-results/bim',
  workers: 1,
  reporter: 'list',
  use: { headless: true, baseURL: 'http://127.0.0.1:4176' },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4176 --strictPort',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
