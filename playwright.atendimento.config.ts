import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './tests/e2e', testMatch: 'atendimento-pagination.spec.ts', workers: 1, timeout: 30000,
 use: { baseURL: 'http://127.0.0.1:4187', headless: true },
 webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4187 --strictPort', port: 4187, reuseExistingServer: false, env: { VITE_USE_MOCK: 'false', VITE_API_URL: '/api' } },
});
