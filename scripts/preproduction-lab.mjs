import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, open, readFile, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { createServer } from 'node:net';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

assert(process.argv[2], 'Informe a pasta bundle da entrega como argumento.');
const bundle = path.resolve(process.argv[2]);
await readFile(path.join(bundle, 'public', 'index.html'));
await mkdir('test-results', { recursive: true });
const lab = await mkdtemp(path.resolve('test-results/preprod-'));
const fresh = path.join(lab, 'original');
const snapshot = path.join(lab, 'snapshot');
const restored = path.join(lab, 'restaurado');
await mkdir(fresh);

async function freePort() {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  probe.close();
  await once(probe, 'close');
  return port;
}

const postgresPort = await freePort();
const password = randomBytes(24).toString('hex');
const jwt = randomBytes(48).toString('hex');
const mfa = randomBytes(32).toString('base64');
const keyPassword = randomBytes(24).toString('hex');
const keystore = path.join(lab, 'laboratorio.p12');
const pem = path.join(lab, 'laboratorio.pem');
const javaSettings = spawnSync('java', ['-XshowSettings:properties', '-version'], { encoding: 'utf8' });
const javaHome = javaSettings.stderr?.match(/^\s*java\.home = (.+)$/m)?.[1]?.trim();
assert(javaHome, 'Instale o JDK 21 e disponibilize java no PATH.');
const keytool = path.join(javaHome, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');
execFileSync(keytool, ['-genkeypair', '-alias', 'loopback', '-keyalg', 'RSA', '-validity', '2',
  '-dname', 'CN=127.0.0.1', '-ext', 'SAN=ip:127.0.0.1', '-storetype', 'PKCS12',
  '-keystore', keystore, '-storepass', keyPassword], { stdio: 'ignore' });
execFileSync(keytool, ['-exportcert', '-rfc', '-alias', 'loopback', '-keystore', keystore,
  '-storepass', keyPassword, '-file', pem], { stdio: 'ignore' });
const ca = await readFile(pem);
const nativePlatform = process.platform === 'win32' ? 'windows' : process.platform;
const { pg_ctl } = await import(`@embedded-postgres/${nativePlatform}-${process.arch}`);

const email = 'admin@laboratorio.example.invalid';
const senha = randomBytes(20).toString('hex') + 'Aa!';
const admin = { email, senha };
let db;
let dbDirectory;
let java;
let port;

async function startDb(directory, initialize) {
  const data = path.join(directory, 'postgres');
  db = new EmbeddedPostgres({
    databaseDir: data, user: 'obra360_lab', password,
    port: postgresPort, persistent: true, autoRehydrateSymlinks: true,
    initdbFlags: [process.platform === 'win32' ? '--encoding=WIN1252' : '--encoding=UTF8', '--locale=C'],
    onLog: () => {},
  });
  if (initialize) await db.initialise();
  execFileSync(pg_ctl, ['start', '-w', '-D', data, '-l', path.join(directory, 'postgres.log'),
    '-o', `-h 127.0.0.1 -p ${postgresPort}`], { stdio: 'ignore', windowsHide: true });
  dbDirectory = data;
  if (initialize) {
    const client = db.getPgClient('postgres', '127.0.0.1');
    await client.connect();
    try {
      await client.query("CREATE DATABASE obra360_lab WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'");
    } finally {
      await client.end();
    }
  }
}

function api(route, { method = 'GET', headers = {}, payload, token, status = 200 } = {}) {
  if (payload && !Buffer.isBuffer(payload)) {
    payload = Buffer.from(JSON.stringify(payload));
    headers['content-type'] = 'application/json';
  }
  if (payload) headers['content-length'] = payload.length;
  if (token) headers.authorization = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    const call = request({ host: '127.0.0.1', port, path: route, ca, method, headers,
      signal: AbortSignal.timeout(8000) }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        if (response.statusCode !== status) {
          reject(new Error(`${method} ${route}: HTTP ${response.statusCode}, esperado ${status}`));
          return;
        }
        const body = Buffer.concat(chunks);
        try {
          resolve(response.headers['content-type']?.includes('json') ? JSON.parse(body) : body);
        } catch (error) {
          reject(error);
        }
      });
    });
    call.on('error', reject);
    call.end(payload);
  });
}

async function startApp(directory, phase, credentials, operator = false) {
  port = await freePort();
  const log = await open(path.join(lab, phase + '.log'), 'w');
  try {
    java = spawn('java', ['-jar', path.join(bundle, 'app.jar'),
      '--spring.web.resources.static-locations=' + pathToFileURL(path.join(bundle, 'public') + path.sep).href],
    { cwd: lab, windowsHide: true, stdio: ['ignore', log.fd, log.fd], env: {
      ...process.env,
      SPRING_PROFILES_ACTIVE: operator ? 'prod,operador' : 'prod',
      SPRING_MAIN_WEB_APPLICATION_TYPE: operator ? 'none' : 'servlet',
      SPRING_DATASOURCE_URL: `jdbc:postgresql://127.0.0.1:${postgresPort}/obra360_lab`,
      SPRING_DATASOURCE_USERNAME: 'obra360_lab', SPRING_DATASOURCE_PASSWORD: password,
      SERVER_ADDRESS: '127.0.0.1', SERVER_PORT: String(port), SERVER_SSL_ENABLED: 'true',
      SERVER_SSL_KEY_STORE: pathToFileURL(keystore).href, SERVER_SSL_KEY_STORE_PASSWORD: keyPassword,
      SERVER_SSL_KEY_STORE_TYPE: 'PKCS12', JWT_SECRET: credentials.jwt, MFA_ENCRYPTION_KEY: credentials.mfa,
      OBRA360_SETUP_ENABLED: 'false', OBRA360_STORAGE_DIRECTORY: path.join(directory, 'documentos'),
      APP_PUBLIC_URL: `https://127.0.0.1:${port}`, DOCUMENT_STORAGE: 'local',
      EMAIL_ENABLED: 'false', GOOGLE_ENABLED: 'false',
      ...(operator ? {
        OP_ACTION: 'criar-empresa', OP_COMPANY_NAME: 'Laboratório Obra360',
        OP_LEGAL_NAME: 'Laboratório Obra360', OP_CNPJ: '12345678000190',
        OP_ADMIN_NAME: 'Administrador do laboratório', OP_ADMIN_EMAIL: email, OP_ADMIN_PASSWORD: senha,
        OP_DATA_ENVIRONMENT: 'HOMOLOGACAO', OP_LIMIT_USERS: '10', OP_LIMIT_PROJECTS: '10', OP_LIMIT_MODELS: '10',
      } : {}),
    } });
    await once(java, 'spawn');
  } finally {
    await log.close();
  }
  if (operator) {
    const [code] = await once(java, 'exit');
    assert.equal(code, 0, 'Falha no provisionamento pelo operador.');
    java = undefined;
    return;
  }
  const until = Date.now() + 90_000;
  while (Date.now() < until && java.exitCode === null) {
    try {
      if ((await api('/actuator/health/readiness')).status === 'UP') return;
    } catch { /* Spring Boot is still starting. */ }
    await sleep(500);
  }
  throw new Error(`Serviço indisponível. Confira ${phase}.log no laboratório.`);
}

async function stop() {
  if (java && java.exitCode === null && java.signalCode === null) {
    const exit = once(java, 'exit');
    java.kill();
    await exit;
  }
  java = undefined;
  if (dbDirectory) {
    execFileSync(pg_ctl, ['stop', '-w', '-m', 'fast', '-D', dbDirectory], { stdio: 'ignore', windowsHide: true });
    dbDirectory = undefined;
  }
}

function totp(secret, counter) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret].map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0')).join('');
  const key = Buffer.from(bits.match(/[01]{8}/g).map((byte) => parseInt(byte, 2)));
  const value = Buffer.alloc(8);
  value.writeBigInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(value).digest();
  return String((digest.readUInt32BE(digest[19] & 15) & 0x7fffffff) % 1e6).padStart(6, '0');
}

const login = (payload, status) => api('/api/v1/auth/login', { method: 'POST', payload, status });
const hash = (data) => createHash('sha256').update(data).digest('hex');
const authMfa = '/api/v1/workspace/mfa';
const bytes = Buffer.from('Documento sintético do laboratório Obra360.\n');
const started = performance.now();
console.log(`Laboratório isolado em ${lab}`);
try {
  await writeFile(path.join(fresh, 'chaves-laboratorio.json'), JSON.stringify({ jwt, mfa }), { mode: 0o600 });
  await startDb(fresh, true);
  await startApp(fresh, 'provisionamento', { jwt, mfa }, true);
  await startApp(fresh, 'app-original', { jwt, mfa });
  console.log('Aplicação iniciada em HTTPS com PostgreSQL e empresa provisionada pelo operador.');
  assert.equal((await api('/api/v1/instalacao')).necessaria, false);
  const html = (await api('/')).toString();
  const script = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  assert(script, 'Bundle JavaScript não encontrado no HTML.');
  assert((await api(script)).length > 0);
  await api('/api/v1/workspace/resumo', { status: 401 });
  const { token } = await login(admin);
  const post = (route, payload, status = 200) => api(route, { method: 'POST', payload, status, token });
  const engineer = await post('/api/v1/auth/cadastrar', { nome: 'Engenheiro do laboratório',
    email: 'engenheiro@laboratorio.example.invalid', senhaHash: randomBytes(20).toString('hex'),
    perfil: 'ENGENHEIRO', ativo: true }, 201);
  const obra = await post('/api/v1/workspace/projetos', { nome: 'Obra do laboratório',
    engenheiroResponsavelId: engineer.id, vgvEstimado: 100000, areaTotalM2: 95,
    dataInicio: '2026-01-01', dataPrevisaoFim: '2027-01-01' }, 201);
  const form = new FormData();
  form.set('projetoObraId', String(obra.id));
  form.set('titulo', 'Documento de verificação');
  form.set('tipoDocumento', 'RELATORIO');
  form.set('arquivo', new Blob([bytes]), 'laboratorio.txt');
  const multipart = new Request('https://127.0.0.1/', { method: 'POST', body: form });
  const document = await api('/api/v1/workspace/documentos', { method: 'POST', token, status: 201,
    headers: Object.fromEntries(multipart.headers), payload: Buffer.from(await multipart.arrayBuffer()) });
  const documentRoute = `/api/v1/workspace/documentos/${document.id}/arquivo`;
  assert.equal(hash(await api(documentRoute, { token })), hash(bytes));
  const { segredo } = await post(authMfa + '/preparar', { senha });
  const counter = Math.floor(Date.now() / 30_000);
  await post(authMfa + '/ativar', { senha, codigo: totp(segredo, counter) });
  await api(documentRoute, { token, status: 401 });
  await stop();

  const recoveryStarted = performance.now();
  await cp(fresh, snapshot, { recursive: true, force: false, errorOnExist: true });
  await cp(snapshot, restored, { recursive: true, force: false, errorOnExist: true });
  await startDb(restored, false);
  const restoredKeys = JSON.parse(await readFile(path.join(restored, 'chaves-laboratorio.json'), 'utf8'));
  await startApp(restored, 'app-restaurado', restoredKeys);
  assert.equal((await login(admin, 401)).code, 'MFA_REQUIRED');
  const nextCounter = Math.max(counter + 1, Math.floor(Date.now() / 30_000));
  const restoredLogin = await login({ ...admin, codigo: totp(segredo, nextCounter) });
  assert.equal(hash(await api(documentRoute, { token: restoredLogin.token })), hash(bytes));
  assert.equal((await api(authMfa, { token: restoredLogin.token })).ativo, true);
  const recoveryMs = Math.round(performance.now() - recoveryStarted);
  console.log('Restauração verificada com login MFA e SHA-256 do documento.');

  const samples = (await Promise.all(Array.from({ length: 8 }, async () => {
    const worker = [];
    for (let index = 0; index < 8; index += 1) {
      const begin = performance.now();
      assert.equal(hash(await api(documentRoute, { token: restoredLogin.token })), hash(bytes));
      worker.push(performance.now() - begin);
    }
    return worker;
  }))).flat().sort((a, b) => a - b);
  const dbClient = db.getPgClient('obra360_lab', '127.0.0.1');
  await dbClient.connect();
  let migrations;
  try {
    const result = await dbClient.query('select count(*)::int as total from flyway_schema_history where success and version is not null');
    migrations = result.rows[0].total;
  } finally {
    await dbClient.end();
  }
  const report = { ambiente: 'laboratório HTTPS em loopback com dados sintéticos', migrations,
    verificacoes: ['frontend compilado', 'TLS com certificado confiado', 'provisionamento offline', 'rota privada',
      'persistência PostgreSQL', 'revogação de token ao ativar MFA', 'restauração física',
      'MFA após restauração', 'SHA-256 do arquivo após restauração'],
    recoveryMs, totalMs: Math.round(performance.now() - started),
    carga: { requisicoes: samples.length, concorrencia: 8, falhas: 0,
      p50Ms: Math.round(samples[Math.ceil(samples.length * 0.50) - 1]),
      p95Ms: Math.round(samples[Math.ceil(samples.length * 0.95) - 1]) } };
  await writeFile(path.join(lab, 'relatorio.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await stop();
}
