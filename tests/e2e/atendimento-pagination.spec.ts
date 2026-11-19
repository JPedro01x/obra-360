import { test, expect } from '@playwright/test';

test('ticket pager resets filters and ignores an older pending page', async ({ page }) => {
 await page.addInitScript(() => sessionStorage.setItem('obra360_access_token', 'test'));
 await page.route('**/api/**', async route => {
   const path = new URL(route.request().url()).pathname;
   if(path.endsWith('/sessao')) return route.fulfill({json:{nome:'Teste',email:'teste@test.invalid',perfil:'ENGENHEIRO',empresa:{nomeFantasia:'Empresa',razaoSocial:'Empresa',cnpj:'0'}}});
   if(path.endsWith('/instalacao')) return route.fulfill({json:{necessaria:false}});
   if(path.endsWith('/configuracao')) return route.fulfill({json:{googleClientId:'',emailRecovery:false}});
   if(path.endsWith('/minhas-sessoes')) return route.fulfill({json:[]});
   if(path.endsWith('/atendimento/pagina')) {
     const query=new URL(route.request().url()).searchParams;
     const filtered=query.has('status');
     if(query.get('page')==='1') await new Promise(resolve=>setTimeout(resolve,500));
     return route.fulfill({json:{items:[{id:filtered?300:query.get('page')==='1'?21:1,assunto:filtered?'Filtrado':'Pedido '+query.get('page'),descricao:'Detalhe',categoria:'SUPORTE',status:'ABERTO',versao:0}],total:filtered?1:41,page:Number(query.get('page')),size:20}}).catch(()=>{});
   }
   return route.fulfill({json:{items:[],total:0,page:0,size:25}});
 });
 await page.goto('/');
 await page.getByRole('button',{name:'Conta e atendimento',exact:true}).click();
 await expect(page.getByRole('heading',{name:'#1 · Pedido 0'})).toBeVisible();
 await page.getByRole('button',{name:'Próxima',exact:true}).click();
 await expect(page.getByText('Carregando solicitações…')).toBeVisible();
 await page.getByLabel('Situação das solicitações').selectOption('ABERTO');
 await expect(page.getByRole('heading',{name:'#300 · Filtrado'})).toBeVisible();
 await page.waitForTimeout(650);
 await expect(page.getByRole('heading',{name:'#300 · Filtrado'})).toBeVisible();
 await expect(page.getByRole('navigation',{name:'Paginação das solicitações'})).toContainText('Página 1 de 1');
 await expect(page.getByRole('button',{name:'Anterior',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Próxima',exact:true})).toBeDisabled();
});

async function fixture(page: import('@playwright/test').Page, role: string) {
 await page.addInitScript(() => sessionStorage.setItem('obra360_access_token','test'));
 await page.route('**/api/**', route => {
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/sessao'))return route.fulfill({json:{nome:'Teste',email:'teste@test.invalid',perfil:role,empresa:{nomeFantasia:'Empresa',razaoSocial:'Empresa',cnpj:'0'}}});
  if(path.endsWith('/instalacao'))return route.fulfill({json:{necessaria:false}});
  if(path.endsWith('/configuracao'))return route.fulfill({json:{}});
  if(path.endsWith('/convites')||path.endsWith('/minhas-sessoes')||path.endsWith('/exportacoes'))return route.fulfill({json:[]});
  return route.fulfill({json:{items:[],total:0,page:0,size:25}});
 });
}

test('conflicting administrative reply reloads the current version before retry',async({page})=>{
 await fixture(page,'SUPER_ADMIN');
 let version=0; const submissions:number[]=[];
 await page.route('**/api/v1/workspace/atendimento/pagina?**',route=>route.fulfill({json:{items:[{id:1,assunto:'Concorrente',descricao:'Detalhe',categoria:'SUPORTE',status:'ABERTO',resposta:'Resposta atual '+version,versao:version}],total:1,page:0,size:20}}));
 await page.route('**/api/v1/workspace/atendimento/1',route=>{
  const body=route.request().postDataJSON();submissions.push(body.versao);
  if(submissions.length===1){version=1;return route.fulfill({status:409,json:{detail:'Solicitação alterada. Atualize antes de responder.'}});}
  return route.fulfill({json:{}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Conta e atendimento',exact:true}).click();
 await page.getByRole('button',{name:'Salvar resposta',exact:true}).click();
 await expect(page.getByText('Solicitação alterada. Atualize antes de responder.')).toBeVisible();
 await expect(page.getByRole('textbox',{name:'Resposta',exact:true})).toHaveValue('Resposta atual 1');
 await page.getByRole('button',{name:'Salvar resposta',exact:true}).click();
 await expect.poll(()=>submissions).toEqual([0,1]);
});

for(const role of ['SUPER_ADMIN','GERENTE_OBRA','AUDITOR','ENGENHEIRO','FINANCEIRO']) {
 test(`messaging permissions and replay for ${role}`,async({page})=>{
  await fixture(page,role);let resolved=false;let attempts=0;
  await page.route('**/api/v1/workspace/mensageria',route=>route.fulfill({json:{habilitada:true,pendentesPublicacao:2,aguardandoProcessamento:1,processados:9,falhasConsumo:resolved?0:1,atrasados:1,requerAtencao:!resolved}}));
  await page.route('**/api/v1/workspace/mensageria/falhas?**',route=>route.fulfill({json:{items:[{id:7,eventoId:'event-7',criadoEm:'2026-11-19T10:00:00Z',tipoErro:'VALIDACAO',resolvidoEm:resolved?'2026-11-19T11:00:00Z':null}],total:1,page:0,size:25}}));
  await page.route('**/api/v1/workspace/mensageria/falhas/7/reprocessar',route=>{attempts++;if(attempts===1)return route.fulfill({status:503,json:{detail:'Reprocessamento indisponível.'}});resolved=true;return route.fulfill({json:{resolvido:true}});});
  await page.goto('/');await page.getByRole('button',{name:'Integrações',exact:true}).click();
  if(['ENGENHEIRO','FINANCEIRO'].includes(role)) {await expect(page.getByRole('heading',{name:'Mensageria operacional',exact:true})).toHaveCount(0);return;}
  await expect(page.getByRole('heading',{name:'Mensageria operacional',exact:true})).toBeVisible();
  await expect(page.getByText('A mensageria requer atenção.')).toBeVisible();
  if(role==='AUDITOR'){await expect(page.getByRole('button',{name:'Reprocessar evento event-7',exact:true})).toHaveCount(0);return;}
  await page.getByRole('button',{name:'Reprocessar evento event-7',exact:true}).click();
  await expect(page.getByText('Reprocessamento indisponível.')).toBeVisible();
  await page.getByRole('button',{name:'Reprocessar evento event-7',exact:true}).click();
  await expect(page.getByText('Resolvido')).toBeVisible();
  await expect(page.getByRole('button',{name:'Reprocessar evento event-7',exact:true})).toHaveCount(0);
  expect(attempts).toBe(2);
 });
}

test('messaging pagination and remount ignore an old pending snapshot',async({page})=>{
 await fixture(page,'AUDITOR');let refreshed=false;
 await page.route('**/api/v1/workspace/mensageria',async route=>{
  const oldSnapshot=!refreshed;
  if(oldSnapshot)await new Promise(resolve=>setTimeout(resolve,800));
  return route.fulfill({json:{habilitada:true,pendentesPublicacao:0,aguardandoProcessamento:0,processados:oldSnapshot?111:777,falhasConsumo:0,atrasados:0,requerAtencao:false}}).catch(()=>{});
 });
 await page.route('**/api/v1/workspace/mensageria/falhas?**',route=>{
  const number=Number(new URL(route.request().url()).searchParams.get('page'));
  return route.fulfill({json:{items:[{id:number+1,eventoId:'page-'+number,criadoEm:'2026-11-19T10:00:00Z',tipoErro:'VALIDACAO',resolvidoEm:null,payload:'SECRET_PAYLOAD',exception:'SECRET_EXCEPTION'}],total:26,page:number,size:25}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Integrações',exact:true}).click();
 await expect(page.getByText('Consultando mensageria…')).toBeVisible();
 await page.getByRole('button',{name:'Conta e atendimento',exact:true}).click();
 refreshed=true;
 await page.getByRole('button',{name:'Integrações',exact:true}).click();
 const panel=page.getByRole('region',{name:'Mensageria operacional',exact:true});
 await expect(panel.getByText('777',{exact:true})).toBeVisible();
 await page.waitForTimeout(900);
 await expect(panel.getByText('111',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Próximas falhas',exact:true}).click();
 await expect(panel.getByRole('navigation',{name:'Paginação das falhas'})).toContainText('Página 2 de 2');
 await expect(panel.getByText(/page-1/)).toBeVisible();
 await expect(panel.getByText(/SECRET_/)).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Próximas falhas',exact:true})).toBeDisabled();
});
