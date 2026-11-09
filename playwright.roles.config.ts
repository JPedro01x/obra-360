import { defineConfig } from '@playwright/test';
import integrated from './playwright.integrated.config';
export default defineConfig({
  ...integrated,
  testDir: './tests/roles',
  outputDir: './test-results/roles',
  timeout: 180000,
  use: { ...integrated.use, trace: 'retain-on-failure' },
});
