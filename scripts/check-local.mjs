import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Read-only smoke check of the actual running installation; no accounts are created.
const base = 'http://127.0.0.1:3000';
const status = await fetch(`${base}/api/v1/instalacao`);
if (!status.ok) throw new Error(`API indisponível: ${status.status}`);
const setup = await status.json();
const anonymous = await fetch(`${base}/api/v1/workspace/registros/projetos`);
if (anonymous.status !== 401) throw new Error('A consulta precisa exigir autenticação.');
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page
    .getByRole('heading', {
      name: setup.necessaria ? 'Configure sua empresa' : 'Acesse sua empresa',
    })
    .waitFor();
  await page.screenshot({ path: 'test-results/local-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/local-mobile.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw new Error('Layout excede a largura móvel.');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    'Instalação local verificada: API disponível, consulta protegida e interface responsiva. Nenhum cadastro foi criado.',
  );
} finally {
  await browser.close();
}
