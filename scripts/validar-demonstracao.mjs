import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readCredentials } from './homologacao-credentials.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const credentials=await readCredentials(root,'ACESSO-DEMONSTRACAO.local');
const state=JSON.parse(await readFile(path.join(root,'obra360-backend/data/demonstracao-empresa.json'),'utf8'));
const account=credentials.contas.find(a=>a.chave==='admin');
const output=path.join(root,'scratch/demonstracao');await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000');
  await page.locator('input[type=radio][value="SUPER_ADMIN"]').check();
  await page.getByLabel('E-mail corporativo',{exact:true}).fill(account.email);
  await page.getByLabel('Senha',{exact:true}).fill(account.senha);
  await page.getByRole('button',{name:'Entrar na plataforma',exact:true}).click();
  await page.getByRole('heading',{name:'Empreendimentos',exact:true}).waitFor();
  await page.getByRole('button',{name:'Novo empreendimento',exact:true}).waitFor();
  await page.getByRole('cell',{name:'Residencial Aurora — Demo',exact:true}).waitFor();
  await page.screenshot({path:path.join(output,'obras.png'),fullPage:true});
  await page.getByRole('navigation').getByRole('button',{name:'Recursos humanos',exact:true}).click();
  await page.getByRole('button',{name:'Cadastrar funcionário',exact:true}).waitFor();
  await page.getByText('Colaborador Demonstrativo 48',{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,'funcionarios.png'),fullPage:true});
  await page.getByRole('navigation').getByRole('button',{name:'Modelador 2D/3D',exact:true}).click();
  await page.getByLabel('Obra do modelo',{exact:true}).selectOption(String(state.registros.obra_0.id));
  await page.getByRole('button',{name:/Planta residencial 1 - Demo/}).click();
  await page.getByLabel('Modo de visualização do modelo',{exact:true}).selectOption('split');
  await page.getByRole('img',{name:'Vista 3D do modelo',exact:true}).waitFor();
  await page.getByRole('img',{name:'Planta 2D editável em metros',exact:true}).waitFor();
  await page.screenshot({path:path.join(output,'planta-2d-3d.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'validacao.json'),JSON.stringify({empresaId:state.empresaId,dadosFicticios:true,
    verificadoEm:new Date().toISOString(),verificacoes:['obras persistidas na interface','funcionarios persistidos na interface','modelo 2D/3D reaberto'],errosJavascript:errors},null,2));
  console.log('Demonstração validada no navegador: obras, RH e planta 2D/3D. Imagens em scratch/demonstracao.');
} finally {await browser.close();}
