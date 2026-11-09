import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCredentials } from './homologacao-credentials.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { contas } = await readCredentials(root);
const account = contas.find(({ perfil }) => perfil === 'SUPER_ADMIN');
assert(account, 'Conta administradora de homologação ausente.');
const verifyOnly = process.argv.includes('--verificar');
const models = '/workspace/modelador/modelos';
const initialReason = 'Homologação: traçado arquitetônico inicial';
const finalReason = 'Homologação: inclusão de janelas e ajuste de aberturas';
const catalog = [
  {
    obra: 'Obra de Homologação — Casa Modelo',
    plantas: [
      ['Residência térrea', [[8, [3.8, 3.2, 3], ['Estar e cozinha', 'Dormitório', 'Banheiro e serviço']]]],
      ['Residência com escritório', [[8.4, [4.1, 3.3, 3.2], ['Estar e cozinha', 'Suíte', 'Escritório']]]],
    ],
  },
  {
    obra: 'Obra de Homologação — Residencial Bosque',
    area: 420,
    plantas: [
      ['Apartamento de dois dormitórios', [[7.2, [4.1, 3, 3], ['Estar e cozinha', 'Dormitório 1', 'Dormitório 2']]]],
      ['Duplex compacto', [
        [7, [4.5, 3.5], ['Estar e jantar', 'Cozinha e serviço']],
        [7, [4.5, 3.5], ['Suíte', 'Dormitório']],
      ]],
    ],
  },
  {
    obra: 'Obra de Homologação — Centro Comercial Horizonte',
    area: 680,
    plantas: [
      ['Loja com estoque', [[9.5, [6, 3.5, 2.5], ['Área de vendas', 'Estoque', 'Apoio']]]],
      ['Conjunto comercial em dois níveis', [
        [9, [5.5, 4.5], ['Recepção', 'Sala de reuniões']],
        [9, [5.5, 4.5], ['Área de trabalho', 'Administração']],
      ]],
    ],
  },
];

let token;
async function api(route, method = 'GET', body) {
  const response = await fetch('http://127.0.0.1:8080/api/v1' + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(`${method} ${route}: HTTP ${response.status}${problem?.detail ? ' — ' + problem.detail : ''}`);
  }
  return response.status === 204 ? null : response.json();
}

async function all(route) {
  const rows = [];
  const delimiter = route.includes('?') ? '&' : '?';
  for (let page = 0; ; page++) {
    const result = await api(`${route}${delimiter}size=25&page=${page}`);
    rows.push(...result.items);
    if (rows.length >= result.total) return rows;
    assert(result.items.length > 0, 'Listagem mudou durante a leitura.');
  }
}

function document(floors, revised) {
  const doc = { schemaVersao: 2, pavimentos: [], elementos: [], nos: [], cotas: [], ambientes: [] };
  for (const [level, [depth, widths, rooms]] of floors.entries()) {
    const id = `nivel-${level}`;
    const height = 2.8;
    const hall = 1.6;
    doc.pavimentos.push({ id, nome: level ? 'Pavimento superior' : 'Térreo', cota: level * 3, altura: height });
    const axes = [0];
    for (const width of widths) axes.push(axes.at(-1) + width);
    const edge = axes.at(-1);
    const nodes = new Map();
    function node(x, z) {
      const key = `${x}:${z}`;
      if (!nodes.has(key)) {
        const point = { id: `${id}-no-${nodes.size}`, pavimentoId: id, x, z };
        nodes.set(key, point);
        doc.nos.push(point);
      }
      return nodes.get(key);
    }
    const element = (suffix, fields) => {
      const record = { id: `${id}-${suffix}`, pavimentoId: id, base: 0, rotacao: 0,
        paredeId: null, deslocamento: 0, ...fields };
      doc.elementos.push(record);
      return record;
    };
    const wall = (suffix, name, a, b, thickness = 0.18) => element(suffix, {
      tipo: 'PAREDE', nome: name, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2,
      largura: Math.hypot(b.x - a.x, b.z - a.z), profundidade: thickness, altura: height,
      rotacao: -Math.atan2(b.z - a.z, b.x - a.x) * 180 / Math.PI, cor: '#d9e2ec',
      noInicioId: a.id, noFimId: b.id,
    });
    const opening = (suffix, parent, window, name) => element(suffix, {
      tipo: window ? 'JANELA' : 'PORTA', nome: name, x: 0, z: 0, paredeId: parent.id,
      largura: window ? 1.45 : revised ? 0.95 : 0.85, profundidade: parent.profundidade,
      altura: window ? 1.15 : 2.1, base: window ? 1.05 : 0, cor: window ? '#72b8da' : '#9b6b43',
    });
    element('laje', { tipo: 'LAJE', nome: 'Laje de piso', x: edge / 2, z: depth / 2,
      largura: edge, profundidade: depth, altura: 0.16, cor: '#d3c2ad' });
    const front = wall('frente', 'Fachada de acesso', node(0, 0), node(edge, 0));
    if (level === 0) opening('acesso', front, false, 'Porta de entrada');
    const frontSides = [0, edge].map((x, index) => wall(`lado-${index}`, 'Parede lateral da circulação', node(x, 0), node(x, hall)));
    const partitions = axes.map((x, index) => wall(`eixo-${index}`,
      index === 0 || index === axes.length - 1 ? 'Parede lateral externa' : 'Divisória entre ambientes',
      node(x, hall), node(x, depth), index === 0 || index === axes.length - 1 ? 0.18 : 0.12));
    const hallWalls = [];
    for (const [index, name] of rooms.entries()) {
      const a = axes[index];
      const b = axes[index + 1];
      const access = wall(`acesso-${index}`, `Divisória de ${name}`, node(a, hall), node(b, hall), 0.12);
      const back = wall(`fundos-${index}`, `Fachada de ${name}`, node(a, depth), node(b, depth));
      hallWalls.push(access.id);
      opening(`porta-${index}`, access, false, `Porta de ${name}`);
      if (revised) opening(`janela-${index}`, back, true, `Janela de ${name}`);
      doc.ambientes.push({ id: `${id}-ambiente-${index}`, pavimentoId: id, nome: name,
        x: (a + b) / 2, z: (hall + depth) / 2,
        paredeIds: [access.id, back.id, partitions[index].id, partitions[index + 1].id] });
    }
    doc.ambientes.push({ id: `${id}-circulacao`, pavimentoId: id, nome: 'Circulação', x: edge / 2,
      z: hall / 2, paredeIds: [front.id, ...frontSides.map(({ id }) => id), ...hallWalls] });
    doc.cotas.push(
      { id: `${id}-cota-largura`, pavimentoId: id, tipo: 'HORIZONTAL',
        ax: 0, az: 0, bx: edge, bz: 0, afastamento: -0.6, noAId: node(0, 0).id, noBId: node(edge, 0).id },
      { id: `${id}-cota-profundidade`, pavimentoId: id, tipo: 'VERTICAL',
        ax: 0, az: 0, bx: 0, bz: depth, afastamento: 0.6, noAId: node(0, 0).id, noBId: node(0, depth).id },
    );
  }
  return doc;
}

({ token } = await api('/auth/login', 'POST', { email: account.email, senha: account.senha }));
try {
  const session = await api('/workspace/sessao');
  assert.equal(session.perfil, 'SUPER_ADMIN');
  assert.equal(session.empresa.ambienteDados, 'HOMOLOGACAO', 'Cadastro restrito à homologação.');
  const projects = await all('/workspace/registros/projetos');
  const base = projects.find(({ nome }) => nome === catalog[0].obra);
  assert(base, 'A obra original de homologação precisa estar presente.');
  for (const { obra, area, plantas } of catalog) {
    let project = projects.find(({ nome }) => nome === obra);
    if (!project && !verifyOnly) {
      project = await api('/workspace/projetos', 'POST', {
        nome: obra, engenheiroResponsavelId: base.engenheiroResponsavelId, areaTotalM2: area,
        vgvEstimado: 0, dataInicio: '2026-11-09', dataPrevisaoFim: '2027-11-09',
      });
      console.log(`Obra cadastrada: ${obra}`);
    }
    assert(project, `Obra ausente: ${obra}`);
    const existing = await all(`${models}?projetoObraId=${project.id}&incluirArquivados=true`);
    for (const [title, floors] of plantas) {
      const nome = `Estudo HML — ${title}`;
      const match = existing.find((record) => record.nome === nome);
      let model = match
        ? await api(`${models}/${match.id}`)
        : verifyOnly ? null : await api(models, 'POST', { nome, projetoObraId: project.id });
      assert(model, `Planta ausente: ${nome}`);
      const route = `${models}/${model.id}`;
      if (!verifyOnly && !model.arquivado && model.revisao === 1 && !model.documento.elementos.length) {
        model = await api(route, 'PUT', { nome, versao: model.versao, motivo: initialReason, documento: document(floors, false) });
      }
      if (!verifyOnly && !model.arquivado && model.revisao === 2) {
        const history = await api(route + '/revisoes');
        if (history.items.some(({ numero, motivo }) => numero === 2 && motivo === initialReason)) {
          model = await api(route, 'PUT', { nome, versao: model.versao, motivo: finalReason, documento: document(floors, true) });
        }
      }
      assert.equal(model.projetoObraId, project.id);
      assert.equal(model.documento.pavimentos.length, floors.length, nome);
      assert(model.documento.elementos.some(({ tipo }) => tipo === 'JANELA'), nome);
      assert(model.revisao >= 3, `Revisões do estudo incompletas: ${nome}`);
      console.log(`#${model.id} | ${nome} | ${model.documento.pavimentos.length} pavimento(s) | ${model.documento.elementos.length} elementos | revisão ${model.revisao}`);
    }
  }
} finally {
  await api('/workspace/minhas-sessoes/sair', 'POST');
}
