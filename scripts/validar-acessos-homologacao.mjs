import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCredentials } from './homologacao-credentials.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const credentials = await readCredentials(root);
const expected = [
  'SUPER_ADMIN',
  'INCORPORADOR',
  'GERENTE_OBRA',
  'ARQUITETO',
  'ENGENHEIRO',
  'FINANCEIRO',
  'RH',
  'MESTRE_OBRA',
  'ALMOXARIFE',
  'AUDITOR',
  'FORNECEDOR',
  'LOCADOR_MAQUINAS',
  'CORRETOR',
  'INVESTIDOR',
  'CLIENTE',
];
const base = 'http://127.0.0.1:8080/api/v1';
let company;
for (const role of expected) {
  const account = credentials.contas.find((a) => a.perfil === role);
  assert(account, `Credencial ausente: ${role}`);
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, senha: account.senha, perfil: role }),
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(login.status, 200, `Falha de autenticação: ${role}`);
  const { token } = await login.json();
  try {
    const response = await fetch(`${base}/workspace/sessao`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const session = await response.json();
    assert.equal(session.perfil, role);
    assert.equal(session.empresa.ambienteDados, 'HOMOLOGACAO');
    company ??= session.empresa.id;
    assert.equal(session.empresa.id, company);
    if (role === 'SUPER_ADMIN') {
      const usersResponse = await fetch(`${base}/workspace/registros/usuarios?size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(usersResponse.status, 200);
      const users = await usersResponse.json();
      assert.equal(users.total, 15);
      assert(users.items.every((u) => !('senhaHash' in u)));
      for (const wanted of expected)
        assert(
          users.items.some((u) => u.perfil === wanted && u.ativo),
          `Conta ausente no banco: ${wanted}`,
        );
    }
    console.log(`Acesso aprovado: ${role}`);
  } finally {
    const logout = await fetch(`${base}/workspace/minhas-sessoes/sair`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(logout.status, 204);
  }
}
console.log('15 perfis ativos autenticados no banco local. Nenhuma senha ou token foi exibido.');
