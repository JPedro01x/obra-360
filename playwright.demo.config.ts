import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  outputDir: './test-results/demo',
  use: { ...config.use, baseURL: 'http://127.0.0.1:4176' },
  testMatch:
    /(?:obra360-react|user-experience|connections-audit|comprehensive-system-audit)\.spec\.ts/,
  webServer: {
    ...config.webServer,
    command: 'node node_modules/vite/bin/vite.js build --mode demo --outDir test-results/demo-dist && node node_modules/vite/bin/vite.js preview --mode demo --outDir test-results/demo-dist --host 127.0.0.1 --port 4176 --strictPort',
    env: { ...config.webServer?.env, VITE_USE_MOCK: 'true' },
    port: 4176,
  },
});
