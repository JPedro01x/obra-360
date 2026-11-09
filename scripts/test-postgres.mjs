import EmbeddedPostgres from 'embedded-postgres';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'node:net';

// Use a fresh loopback port; never stop or reuse an unknown PostgreSQL service.
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', resolve);
});
const port = probe.address().port;
await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'obra360-backend', 'target');
await mkdir(target, { recursive: true });
const directory = await mkdtemp(path.join(target, 'pg-validation-'));
const password = randomBytes(24).toString('hex');
const server = new EmbeddedPostgres({
  databaseDir: directory,
  user: 'obra360_test',
  password,
  port,
  persistent: true,
  autoRehydrateSymlinks: true,
  initdbFlags: [
    process.platform === 'win32' ? '--encoding=WIN1252' : '--encoding=UTF8',
    '--locale=C',
  ],
  postgresFlags: ['-h', '127.0.0.1'],
});
try {
  await server.initialise();
  await server.start();
  const admin = server.getPgClient();
  await admin.connect();
  try {
    await admin.query(
      "CREATE DATABASE obra360_validation WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'",
    );
  } finally {
    await admin.end();
  }
  console.log(
    `Validando em PostgreSQL real isolado na porta ${port}. O banco da aplicação não será alterado.`,
  );
  const env = {
    ...process.env,
    TEST_POSTGRES_URL: `jdbc:postgresql://127.0.0.1:${port}/obra360_validation`,
    TEST_POSTGRES_USERNAME: 'obra360_test',
    TEST_POSTGRES_PASSWORD: password,
  };
  const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'mvn';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'mvn test --batch-mode -Dtest=PostgresWorkflowIntegrationTest']
      : ['test', '--batch-mode', '-Dtest=PostgresWorkflowIntegrationTest'];
  const code = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: path.join(root, 'obra360-backend'),
      env,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.on('error', reject);
    child.on('exit', resolve);
  });
  process.exitCode = code || 0;
} finally {
  await server.stop();
}
