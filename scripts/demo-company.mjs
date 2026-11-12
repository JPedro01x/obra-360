import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './load-env.mjs';
import { readCredentials, writeCredentials } from './homologacao-credentials.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = path.join(root, 'obra360-backend/data/demonstracao-empresa.json');
const privateFile = 'ACESSO-DEMONSTRACAO.local';
const base = 'http://127.0.0.1:8080/api/v1';
const mode = process.argv[2];
assert(['--provisionar', '--popular', '--verificar'].includes(mode) && process.argv.length === 3,
  'Use --provisionar (API parada), --popular ou --verificar. Apenas demonstração local.');
const date = (offset = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
  .format(new Date(Date.now() + offset * 86400000));
const workdays=[];
for(let n=0;workdays.length<5;n++) { const value=date(-n), day=new Date(`${value}T12:00:00Z`).getUTCDay(); if(day!==0 && day!==6)workdays.push(value); }
const password = () => `${randomBytes(20).toString('base64url')}aA9!`;
let state;
try { state = JSON.parse(await readFile(file, 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; state = { formato: 'obra360-demo-empresa-v1', aviso: 'DADOS FICTICIOS. SEM VALIDADE EMPRESARIAL, FISCAL OU TRABALHISTA.', registros: {}, chaves: {}, inicio: date(), fim: date(365) }; }
let credentials;
try { credentials = await readCredentials(root, privateFile); }
catch (e) {
  if (e.code !== 'ENOENT') throw e;
  assert(mode === '--provisionar', 'Provisione primeiro a empresa fictícia.');
  credentials = { aviso: state.aviso, empresa: 'Construtora Horizonte — Demonstração', contas: [
    { chave: 'admin', perfil: 'SUPER_ADMIN', email: 'admin@horizonte-demo.test.invalid', senha: password() },
  ] };
}
const persist = () => writeFile(file, JSON.stringify(state, null, 2), { mode: 0o600 });
const secrets = () => writeCredentials(root, credentials, privateFile);
if (mode === '--provisionar') {
  await access(path.join(root, 'obra360-backend/data/obra360.mv.db'));
  try { await fetch(`${base}/instalacao`, { signal: AbortSignal.timeout(2000) }); throw new Error('Pare a API antes de provisionar; faça backup do banco.'); }
  catch (e) { if (e.message.startsWith('Pare a API')) throw e; }
  assert(!state.empresaId, 'A empresa já está provisionada; use --popular.');
  await secrets();
  const env = { ...(await loadProjectEnv(root)), OP_ACTION: 'criar-empresa',
    OP_COMPANY_NAME: credentials.empresa, OP_LEGAL_NAME: 'Construtora Horizonte Demonstracao Ficticia Ltda',
    OP_CNPJ: '00000000907101', OP_ADMIN_NAME: 'Administrador da Demonstracao',
    OP_ADMIN_EMAIL: credentials.contas[0].email, OP_ADMIN_PASSWORD: credentials.contas[0].senha,
    OP_DATA_ENVIRONMENT: 'HOMOLOGACAO', OP_LIMIT_USERS: '120', OP_LIMIT_PROJECTS: '30', OP_LIMIT_MODELS: '120',
    SPRING_DATASOURCE_URL: 'jdbc:h2:file:./data/obra360;MODE=PostgreSQL;DB_CLOSE_ON_EXIT=FALSE',
  };
  const java = env.JAVA_HOME ? path.join(env.JAVA_HOME, 'bin', process.platform==='win32'?'java.exe':'java') : 'java';
  let output = '';
  const code = await new Promise((resolve, reject) => {
    const child = spawn(java, ['-Xmx512m', '-jar', 'target/obra360-backend-1.0.0-SNAPSHOT.jar',
      '--spring.profiles.active=local,operador', '--spring.main.web-application-type=none'],
    { cwd: path.join(root, 'obra360-backend'), env, windowsHide: true });
    child.stdout.on('data', d => { output += d; }); child.stderr.on('data', d => { output += d; });
    child.once('error', reject); child.once('exit', resolve);
  });
  await writeFile(path.join(root, 'obra360-backend/data/demonstracao-provisionamento.log'), output, { mode: 0o600 });
  assert.equal(code, 0, 'Falha no provisionamento; consulte o log privado, sem repetir inclusões manualmente.');
  const id = output.match(/Empresa provisionada\. ID=(\d+)/)?.[1];
  assert(id, 'Identificador da empresa ausente.'); state.empresaId = Number(id); await persist();
  console.log(`Empresa fictícia provisionada: ${credentials.empresa}. ID ${state.empresaId}. Reinicie a API e use --popular.`);
  process.exit(0);
}
const tokens = new Map();
async function localFetch(url, options) {
  for(let attempt=0;attempt<3;attempt++) {
    const response=await fetch(url,{...options,signal:AbortSignal.timeout(45000)});
    if(response.status!==429 || attempt===2)return response;
    const seconds=Math.min(60,Math.max(1,Number(response.headers.get('retry-after'))||2));
    console.log(`Limite local de requisicoes: aguardando ${seconds}s antes de tentar novamente.`);
    await new Promise(resolve=>setTimeout(resolve,seconds*1000));
  }
}
async function login(account) {
  const response = await localFetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, senha: account.senha }), signal: AbortSignal.timeout(45000) });
  assert(response.ok, `Login da demonstração falhou: HTTP ${response.status}.`);
  return (await response.json()).token;
}
async function api(route, method = 'GET', body, actor = 'admin') {
  if (!tokens.has(actor)) {
    const account = credentials.contas.find(a => a.chave === actor); assert(account, 'Conta da demonstração ausente.');
    tokens.set(actor, await login(account));
  }
  const response = await localFetch(base + route, { method, headers: { Authorization: `Bearer ${tokens.get(actor)}`,
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(45000) });
  assert(response.ok, `${method} ${route}: HTTP ${response.status}. ${(await response.clone().text()).slice(0, 300)}`);
  const text=await response.text();return text?JSON.parse(text):null;
}
const session = await api('/workspace/sessao');
assert(session.empresa.id === state.empresaId && session.empresa.ambienteDados === 'HOMOLOGACAO' &&
  session.empresa.nomeFantasia === credentials.empresa, 'A API não está na empresa fictícia esperada. Nenhum dado será criado.');
async function step(key, route, body, method = 'POST', actor = 'admin') {
  if (state.registros[key]) return state.registros[key];
  const result = (await api(route, method, body, actor)) || { concluido: true };
  if (result.acessoInicial) {
    credentials.contas.push({ chave: key, perfil: result.acessoInicial.perfil, email: result.acessoInicial.email, senha: result.acessoInicial.senha, senhaInicial: true });
    await secrets(); delete result.acessoInicial;
  }
  state.registros[key] = result; await persist(); return result;
}
async function account(key, perfil, nome) {
  let entry = credentials.contas.find(a => a.chave === key);
  if (!entry) { entry = { chave: key, perfil, email: `${key.toLowerCase()}@horizonte-demo.test.invalid`, senha: password() }; credentials.contas.push(entry); await secrets(); }
  return step(key, '/auth/cadastrar', { nome, email: entry.email, senhaHash: entry.senha, perfil, ativo: true });
}
async function all(resource, rh = false) {
  const rows = []; let page = 0, total;
  do { const result = await api(`/workspace/${rh ? 'rh/' : ''}registros/${resource}?size=100&page=${page++}`); rows.push(...result.items); total = result.total; } while (rows.length < total);
  return rows;
}
function cpf(index) {
  let value = String(900071000 + index);
  for (let size = 9; size <= 10; size++) {
    const sum = [...value].reduce((n, digit, i) => n + Number(digit) * (size + 1 - i), 0);
    const rest = (sum * 10) % 11; value += rest > 9 ? 0 : rest;
  }
  return value;
}
function pdf(title) {
  const text = `BT /F1 16 Tf 50 780 Td (${title}) Tj 0 -30 Td /F1 11 Tf (DADOS FICTICIOS - SEM VALIDADE REAL.) Tj ET`;
  const objects = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>', `<</Length ${Buffer.byteLength(text)}>>\nstream\n${text}\nendstream`];
  let result = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(result)); result += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(result); result += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(result);
}
function plan(variant, width = 8) {
  const floor = 'terreo', xs = [0, width * (variant ? 0.6 : 0.45), width], zs = [0, 3, 6, 9];
  const nos = [], elementos = [], ambientes = [];
  const node = (x, z) => `n${x}-${z}`;
  for (let x = 0; x < 3; x++) for (let z = 0; z < 4; z++) nos.push({ id: node(x,z), pavimentoId: floor, x: xs[x], z: zs[z] });
  function wall(id, ax, az, bx, bz) {
    const dx = xs[bx]-xs[ax], dz=zs[bz]-zs[az];
    elementos.push({ id, pavimentoId: floor, tipo: 'PAREDE', nome: `Parede ${id}`, x: (xs[ax]+xs[bx])/2, z: (zs[az]+zs[bz])/2,
      base: 0, largura: Math.hypot(dx,dz), profundidade: 0.15, altura: 2.8, rotacao: -Math.atan2(dz,dx)*180/Math.PI,
      cor: '#cbd5e1', paredeId: null, deslocamento: 0, noInicioId: node(ax,az), noFimId: node(bx,bz) });
  }
  for (let z=0;z<4;z++) for(let x=0;x<2;x++) wall(`h${x}-${z}`,x,z,x+1,z);
  for (let x=0;x<3;x++) for(let z=0;z<3;z++) wall(`v${x}-${z}`,x,z,x,z+1);
  for(const [i,id] of ['h0-0','v1-0','h0-1','h1-1','h0-2','h1-2','v0-0','v2-0','v0-2','v2-2'].entries()) {
    const wall=elementos.find(w=>w.id===id),door=i<6;
    elementos.push({id:`abertura-${i}`,pavimentoId:floor,tipo:door?'PORTA':'JANELA',nome:`${door?'Porta':'Janela'} ${i+1}`,
      x:0,z:0,base:door?0:1.1,largura:door?0.9:1.2,profundidade:wall.profundidade,altura:door?2.1:1.1,
      rotacao:0,cor:door?'#a78055':'#74b9e8',paredeId:wall.id,deslocamento:0,noInicioId:null,noFimId:null});
  }
  const names = ['Sala', 'Cozinha', 'Quarto 1', 'Banheiro', 'Quarto 2', 'Escritorio'];
  for(let z=0;z<3;z++) for(let x=0;x<2;x++) ambientes.push({ id:`a${x}-${z}`,pavimentoId:floor,nome:names[z*2+x],x:(xs[x]+xs[x+1])/2,z:(zs[z]+zs[z+1])/2,
    paredeIds:[`h${x}-${z}`,`v${x+1}-${z}`,`h${x}-${z+1}`,`v${x}-${z}`] });
  return { schemaVersao:2,pavimentos:[{id:floor,nome:'Terreo demonstrativo',cota:0,altura:2.8}],nos,elementos,ambientes,
    cotas:[{id:'cota-1',pavimentoId:floor,tipo:'ALINHADA',ax:0,az:0,bx:xs[1],bz:0,afastamento:-0.4,noAId:node(0,0),noBId:node(1,0)}] };
}

if (mode === '--popular') {
  for (const role of ['ENGENHEIRO','RH','FINANCEIRO','GERENTE_OBRA','ARQUITETO','MESTRE_OBRA','ALMOXARIFE','AUDITOR','INCORPORADOR','CLIENTE','CORRETOR','FORNECEDOR','LOCADOR_MAQUINAS','INVESTIDOR'])
    await account(role, role, `${role.replaceAll('_',' ')} - Demonstracao`);
  const engineer = state.registros.ENGENHEIRO;
  const suppliers = [];
  for(let i=0;i<12;i++) suppliers.push(await step(`fornecedor_${i}`, '/workspace/fornecedores', {
    cnpj: String(90710000000000+i), razaoSocial: `${['Cimentos','Acos','Hidraulica','Eletrica','Agregados','Acabamentos'][i%6]} Horizonte Demo ${i+1}`,
    categoriaFornecimento: i<8?'INSUMOS':i<10?'SERVICOS':'FROTAS' }));
  const departments = [], jobs = [];
  for(const [i,name] of ['Operacoes de obra','Engenharia','Administrativo','Seguranca do trabalho'].entries()) {
    const department = await step(`departamento_${i}`, '/workspace/rh/estrutura', { tipo:'DEPARTAMENTO',nome:name,ativo:true }); departments.push(department);
    const job = await step(`cargo_${i}`, '/workspace/rh/estrutura', {tipo:'CARGO',nome:['Oficial de obras','Tecnico de engenharia','Assistente administrativo','Tecnico de seguranca'][i],departamentoId:department.id,ativo:true}); jobs.push(job);
  }
  const payroll = await step('folha', '/workspace/rh/folhas', {competencia: state.inicio.slice(0,7)});
  const materialNames = ['Cimento CP II 50 kg','Areia media','Aco CA-50','Bloco ceramico','Tubo PVC','Brita 1','Tinta acrilica','Aditivo','Cabo eletrico','Madeira para formas'];
  const units = ['SC','M3','KG','UN','M','M3','BALDE','L','M','M2'], costs=[46,180,9.2,2.8,35,160,350,22,4.5,38];
  const projectNames = ['Residencial Aurora','Condominio Jardim das Palmeiras','Edificio Comercial Central','Residencial Vista Verde','Centro Logistico Horizonte','Vila das Acacias'];
  for(let p=0;p<6;p++) {
    const project = await step(`obra_${p}`, '/workspace/projetos', {nome:`${projectNames[p]} — Demo`,engenheiroResponsavelId:engineer.id,
      areaTotalM2:[1800,2400,3200,1600,5000,1200][p],vgvEstimado:[6200000,8500000,14500000,5400000,18000000,4200000][p],dataInicio:state.inicio,dataPrevisaoFim:state.fim});
    const teams=[],contracts=[],items=[];
    for(let t=0;t<3;t++) {
      teams.push(await step(`equipe_${p}_${t}`, '/workspace/equipes', {projetoObraId:project.id,liderEncarregadoId:engineer.id,nomeEquipe:`${['Estrutura','Instalacoes','Acabamento'][t]} ${p+1}`,especialidade:['ALVENARIA','INSTALACOES','ACABAMENTOS'][t],quantidadeOperarios:t===2?2:3}));
      contracts.push(await step(`contrato_${p}_${t}`, '/workspace/contratos', {projetoObraId:project.id,fornecedorB2bId:suppliers[(p+t)%12].id,numeroContrato:`DEMO-${p+1}-${t+1}`,valorTotal:250000*(t+1),retencaoTecnicaPct:5,tempoLimiteSlaHoras:48,dataInicio:state.inicio,dataTermino:state.fim}));
      const stage=await step(`etapa_${p}_${t}`, '/workspace/cronograma', {projetoObraId:project.id,nomeEtapa:['Fundacoes e estrutura','Instalacoes','Acabamentos'][t],ordemExecucao:t+1,dataInicioPrevista:date(t*30),dataFimPrevista:date((t+1)*45)});
      if(p%2===0) await step(`avanco_${p}_${t}`,`/workspace/cronograma/${stage.id}/progresso`,{percentualExecutado:[35,10,0][t]},'PATCH');
    }
    for(let m=0;m<10;m++) {
      const item=await step(`material_${p}_${m}`, '/workspace/estoque',{projetoObraId:project.id,sku:`DEM-${p+1}-${m+1}`,nome:materialNames[m],categoria:m<6?'INSUMOS':'ACABAMENTOS',unidadeMedida:units[m],estoqueMinimo:20,custoUnitarioMedio:costs[m]});items.push(item);
      const key=`entrada_${p}_${m}`; if(!state.chaves[key]){state.chaves[key]=randomUUID();await persist();}
      await step(key,'/workspace/movimentacoes',{itemEstoqueId:item.id,tipoMovimentacao:'ENTRADA',quantidade:300+m*20,chaveOperacao:state.chaves[key]});
    }
    for(let o=0;o<12;o++) {
      const order=await step(`os_${p}_${o}`,'/workspace/ordens',{contratoServicoId:contracts[o%3].id,equipeTrabalhoId:teams[o%3].id,descricao:`${['Execucao de alvenaria','Montagem de instalacoes','Conferencia de acabamento','Organizacao do canteiro'][o%4]} — frente ${o+1}, obra ${p+1}, demonstracao`,prioridade:['BAIXA','MEDIA','ALTA','URGENTE'][o%4],exigeMaterial:true});
      const key=`consumo_${p}_${o}`;if(!state.chaves[key]){state.chaves[key]=randomUUID();await persist();}
      await step(key,'/workspace/movimentacoes',{itemEstoqueId:items[o%10].id,tipoMovimentacao:'CONSUMO_OS',quantidade:2+o%3,ordemServicoId:order.id,chaveOperacao:state.chaves[key]});
      if(o%3!==2)await step(`os_andamento_${p}_${o}`,`/workspace/ordens/${order.id}/status`,{status:'EM_ANDAMENTO'},'PATCH');
      if(o%3===0)await step(`os_concluida_${p}_${o}`,`/workspace/ordens/${order.id}/status`,{status:'CONCLUIDO'},'PATCH');
    }
    for(let c=0;c<3;c++) {
      const purchase=await step(`compra_${p}_${c}`,'/workspace/compras',{itemEstoqueId:items[c].id,quantidade:40,justificativa:'Reposicao programada de insumos da frente de trabalho - demonstracao.'});
      const proposal=await step(`proposta_${p}_${c}` ,`/workspace/compras/${purchase.id}/propostas`,{fornecedorB2bId:suppliers[(p+c)%12].id,valorProposta:40*costs[c],prazoEntregaDias:3+c});
      await step(`compra_selecao_${p}_${c}`,`/workspace/compras/${purchase.id}/selecionar`,{cotacaoId:proposal.id});
      if(c<2) {
        await step(`compra_gestao_${p}_${c}`,`/workspace/compras/${purchase.id}/aprovar`,{alcada:'GESTAO'});
        await step(`compra_financeiro_${p}_${c}`,`/workspace/compras/${purchase.id}/aprovar`,{alcada:'FINANCEIRO'},'POST','FINANCEIRO');
        await step(`pedido_${p}_${c}`,`/workspace/compras/${purchase.id}/pedido`,{});
      }
      if(c===0)await step(`recebimento_${p}_${c}`,`/workspace/compras/${purchase.id}/receber`,{});
    }
    for(let e=0;e<8;e++) {
      const index=p*8+e,category=e<5?0:e===5?1:e===6?2:3;
      const employee=await step(`funcionario_${index}`,'/workspace/rh/funcionarios',{matricula:`DEM-${String(index+1).padStart(3,'0')}`,nome:`Colaborador Demonstrativo ${String(index+1).padStart(2,'0')}`,cpf:cpf(index),email:`colaborador${index+1}@horizonte-demo.test.invalid`,nascimento:'1990-01-15',admissao:date(-180),vinculo:'CLT',departamentoId:departments[category].id,cargoId:jobs[category].id,projetoObraId:project.id,equipeId:teams[e%3].id,salarioBase:[2800,4200,2600,3800][category],jornadaSemanalMinutos:2640});
      for(let d=0;d<5;d++) await step(`ponto_${index}_${d}`,'/workspace/rh/ponto',{funcionarioId:employee.id,data:workdays[d],entrada:'08:00',saidaIntervalo:'12:00',retornoIntervalo:'13:00',saida:'17:00',observacao:'Registro sintetico para demonstracao.'});
      await step(`beneficio_${index}`,'/workspace/rh/beneficios',{funcionarioId:employee.id,nome:'Vale alimentacao demonstrativo',valorEmpresa:550,descontoFuncionario:30,inicio:date(-30),ativo:true});
      await step(`treinamento_${index}`,'/workspace/rh/treinamentos',{funcionarioId:employee.id,tipo:'TREINAMENTO',titulo:'Integracao de seguranca - registro ficticio',realizacao:date(-20),validade:date(345),cargaHorariaMinutos:240,instituicao:'Centro de Treinamento Demonstrativo'});
      await step(`salario_${index}`,'/workspace/rh/lancamentos',{folhaId:payroll.id,funcionarioId:employee.id,codigo:'DEMO-SAL',descricao:'Remuneracao informada para simulacao',natureza:'PROVENTO',valor:[2800,4200,2600,3800][category]});
      await step(`desconto_${index}`,'/workspace/rh/lancamentos',{folhaId:payroll.id,funcionarioId:employee.id,codigo:'DEMO-DESC',descricao:'Desconto administrativo ficticio, sem calculo tributario',natureza:'DESCONTO',valor:150});
      if(e===0)await step(`ferias_${index}`,'/workspace/rh/afastamentos',{funcionarioId:employee.id,tipo:'FERIAS',inicio:date(30+p),fim:date(39+p),observacao:'Solicitacao ficticia, sem apuracao de direito trabalhista.'});
    }
    const client=p===0?state.registros.CLIENTE:await account(`cliente_${p}`,'CLIENTE',`Cliente Demonstrativo ${p+1}`);
    const unit=await step(`unidade_${p}`,'/workspace/unidades',{projetoObraId:project.id,codigoUnidade:`DEMO-${p+1}-101`,areaPrivativaM2:72+18*(p%2),valorTabela:320000+p*25000});
    await step(`acesso_cliente_${p}`,'/workspace/acessos',{usuarioId:client.id,projetoObraId:project.id,unidadeImobiliariaId:unit.id});
    await step(`unidade_vendida_${p}`,`/workspace/unidades/${unit.id}/status`,{situacaoEsperada:'DISPONIVEL',status:'VENDIDO'},'PATCH');
    const saleUnit=await step(`unidade_venda_${p}`,'/workspace/unidades',{projetoObraId:project.id,codigoUnidade:`DEMO-${p+1}-102`,areaPrivativaM2:84,valorTabela:350000+p*25000});
    for(const role of ['CORRETOR','INVESTIDOR','FORNECEDOR','LOCADOR_MAQUINAS']) {
      const binding=await step(`acesso_${role}_${p}`,'/workspace/acessos',{usuarioId:state.registros[role].id,projetoObraId:project.id,
        ...(['FORNECEDOR','LOCADOR_MAQUINAS'].includes(role)?{fornecedorB2bId:suppliers[role==='FORNECEDOR'?p:10+p%2].id}:{})});
      if(['FORNECEDOR','LOCADOR_MAQUINAS'].includes(role))await step(`portal_proposta_${role}_${p}`,'/portal/propostas',{acessoId:binding.id,valor:role==='FORNECEDOR'?18000:8500,prazoDias:role==='FORNECEDOR'?5:2},'POST',role);
    }
    if(p%2===0) {
      if(!state.registros[`reserva_${p}`]) {
        const actual=(await all('unidades')).find(u=>u.id===saleUnit.id);
        if(actual?.statusVenda==='RESERVADO' && actual.reservaUsuarioId===state.registros.CORRETOR.id) {
          state.registros[`reserva_${p}`]={concluido:true};await persist();
        }
      }
      await step(`reserva_${p}`,`/portal/unidades/${saleUnit.id}/reservar`,{},'POST','CORRETOR');
    }
    if(p===1)await step('cliente_multiplas_obras','/workspace/acessos',{usuarioId:state.registros.CLIENTE.id,projetoObraId:project.id,unidadeImobiliariaId:unit.id});
    await step(`cobertura_${p}`,'/workspace/coberturas',{unidadeId:unit.id,categoria:'ACABAMENTO',dataInicio:state.inicio,dataFim:state.fim,descricao:'Cobertura ficticia para demonstracao, sem efeito contratual.',ativo:true});
    await step(`garantia_${p}`,'/workspace/garantias',{unidadeImobiliariaId:unit.id,usuarioClienteId:client.id,descricaoDefeito:'Ajuste ficticio de acabamento na unidade demonstrativa.',categoriaDefeito:'ACABAMENTO'});
    await step(`qualidade_${p}`,'/workspace/qualidade',{projetoObraId:project.id,responsavelId:engineer.id,titulo:`Conferencia de organizacao - frente ${p+1}`,normaRegulamentadora:'CHECKLIST INTERNO DEMO',grauSeveridade:'BAIXA'});
    for(let m=0;m<2;m++) {
      const model=await step(`modelo_${p}_${m}`,'/workspace/modelador/modelos',{projetoObraId:project.id,nome:`${m?'Planta alternativa':'Planta residencial'} ${p+1} - Demo`});
      const saved=await step(`modelo_salvo_${p}_${m}`,`/workspace/modelador/modelos/${model.id}`,{versao:0,nome:model.nome,motivo:'Modelo sintetico de seis ambientes, sem valor de projeto executivo.',documento:plan(m)},'PUT');
      await step(`publicacao_${p}_${m}`,`/workspace/modelador/modelos/${model.id}/publicacao`,{unidadeId:unit.id,revisao:saved.revisao,versao:saved.versao},'PATCH');
      const latest=await api(`/workspace/modelador/modelos/${model.id}`);
      const adjusted=await step(`modelo_compativel_${p}_${m}`,`/workspace/modelador/modelos/${model.id}`,{versao:latest.versao,nome:model.nome,motivo:'Revisao demonstrativa do layout, com area compativel com a unidade.',documento:plan(m,p%2?10:8)},'PUT');
      await step(`republicacao_${p}_${m}`,`/workspace/modelador/modelos/${model.id}/publicacao`,{unidadeId:unit.id,revisao:adjusted.revisao,versao:adjusted.versao},'PATCH');
      const beforeOpenings=await api(`/workspace/modelador/modelos/${model.id}`);
      const opened=await step(`modelo_aberturas_${p}_${m}`,`/workspace/modelador/modelos/${model.id}`,{versao:beforeOpenings.versao,nome:model.nome,motivo:'Revisao demonstrativa com portas e janelas ancoradas nas paredes.',documento:plan(m,p%2?10:8)},'PUT');
      await step(`publicacao_aberturas_${p}_${m}`,`/workspace/modelador/modelos/${model.id}/publicacao`,{unidadeId:unit.id,revisao:opened.revisao,versao:opened.versao},'PATCH');
      const form=new FormData();form.set('projetoObraId',String(project.id));form.set('titulo',`Memorial demonstrativo ${p+1}-${m+1}`);form.set('tipoDocumento','PDF');form.set('arquivo',new Blob([pdf(`Memorial demonstrativo ${p+1}-${m+1}`)],{type:'application/pdf'}),`memorial-demo-${p+1}-${m+1}.pdf`);
      await step(`documento_${p}_${m}`,'/workspace/documentos',form);
    }
    console.log(`Obra demonstrativa ${p+1}/6 populada.`);
  }
  const current=await api(`/workspace/rh/registros/folhas/${payroll.id}`);
  const closed=await step('folha_fechada',`/workspace/rh/folhas/${payroll.id}/fechar`,{versao:current.versao});
  await step('folha_paga',`/workspace/rh/folhas/${payroll.id}/pagar`,{versao:closed.versao,data:date()});
}

const counts = {};
for(const resource of ['projetos','equipes','contratos','estoque','ordens','compras','documentos','unidades','garantias','cronograma','usuarios']) counts[resource]=(await all(resource)).length;
for(const resource of ['funcionarios','ponto','beneficios','treinamentos','folhas','lancamentos']) counts[`rh_${resource}`]=(await all(resource,true)).length;
const expected={projetos:6,equipes:18,contratos:18,estoque:60,ordens:72,compras:18,documentos:12,unidades:12,rh_funcionarios:48,rh_ponto:240,rh_beneficios:48,rh_treinamentos:48,rh_folhas:1,rh_lancamentos:96};
for(const [name,total] of Object.entries(expected))assert.equal(counts[name],total,`Contagem divergente: ${name}.`);
const orderStates={};for(const row of await all('ordens'))orderStates[row.statusOs]=(orderStates[row.statusOs]||0)+1;
assert.deepEqual(orderStates,{CONCLUIDO:24,EM_ANDAMENTO:24,ABERTO:24});
const purchaseStates={};for(const row of await all('compras'))purchaseStates[row.status]=(purchaseStates[row.status]||0)+1;
assert.equal(purchaseStates.RECEBIDO,6);assert.equal(purchaseStates.PEDIDO,6);assert.equal(purchaseStates.APROVACAO,6);
const unitStates={};for(const u of await all('unidades'))unitStates[u.statusVenda]=(unitStates[u.statusVenda]||0)+1;assert.equal(unitStates.VENDIDO,6);assert.equal(unitStates.RESERVADO,3);assert.equal(unitStates.DISPONIVEL,3);
const payrolls=await all('folhas',true);assert.equal(payrolls[0].situacao,'PAGA');
const stock=await all('estoque');
for(let p=0;p<6;p++) for(let m=0;m<10;m++) {
  const item=state.registros[`material_${p}_${m}`];let balance=300+m*20+(m===0?40:0);
  for(let o=0;o<12;o++)if(o%10===m)balance-=2+o%3;
  assert.equal(Number(stock.find(row=>row.id===item.id)?.quantidadeAtual),balance,`Saldo divergente no material ${item.id}.`);
}
for(let p=0;p<6;p++)for(let m=0;m<2;m++) {
  const model=await api(`/workspace/modelador/modelos/${state.registros[`modelo_${p}_${m}`].id}`);
  assert.equal(model.documento.ambientes.length,6);assert.equal(model.documento.elementos.filter(e=>e.tipo==='PORTA').length,6);assert.equal(model.documento.elementos.filter(e=>e.tipo==='JANELA').length,4);
  const width=Math.max(...model.documento.nos.map(n=>n.x))-Math.min(...model.documento.nos.map(n=>n.x));
  const depth=Math.max(...model.documento.nos.map(n=>n.z))-Math.min(...model.documento.nos.map(n=>n.z));
  assert.equal(width*depth,72+18*(p%2),'Area de demonstracao divergente da unidade.');
}
state.verificacao={verificadoEm:new Date().toISOString(),contagens:counts,saldosConferidos:60,modelosConferidos:12,ambiente:'HOMOLOGACAO',dadosFicticios:true};await persist();
console.log(JSON.stringify({empresa:credentials.empresa,empresaId:state.empresaId,...state.verificacao},null,2));
