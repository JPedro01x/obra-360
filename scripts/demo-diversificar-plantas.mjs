import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './load-env.mjs';
import { readCredentials } from './homologacao-credentials.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const statePath=path.join(root,'obra360-backend/data/demonstracao/empresa.json');
const state=JSON.parse(await readFile(statePath,'utf8'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza'}).format(new Date());
const endDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza'}).format(new Date(Date.now()+365*86400000));
const env=await loadProjectEnv(root);
const base='http://127.0.0.1:8081/api/v1';
const credentials=await readCredentials(root,env.OBRA360_DEMO_PRIVATE_FILE||'ACESSO-DEMONSTRACAO.local');
const admin=credentials.contas.find(c=>c.chave==='admin');
assert(admin,'Conta administrativa demonstrativa não encontrada.');
const login=await fetch(`${base}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:admin.email,senha:admin.senha})});
assert(login.ok,`Login administrativo HTTP ${login.status}.`);
const token=(await login.json()).token;
async function api(route,method='GET',body){
  const response=await fetch(base+route,{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
  const text=await response.text();
  assert(response.ok,`${method} ${route}: HTTP ${response.status} ${text.slice(0,250)}`);
  return response.status===204||!text?null:JSON.parse(text);
}
async function persist(){await writeFile(statePath,JSON.stringify(state,null,2));}

function documentPlan({floors=1,width=18,depth=12,names=[],height=3.2,kind='building',cols=3,rows=3,occupied}){
  const dx=width/cols,dz=depth/rows,levels=[],nodes=[],elements=[],rooms=[],dimensions=[];
  const roomNames=names.length?names:['Recepção','Sala de reunião','Escritório','Copa','Sanitário','Circulação','Apoio','Arquivo','Área técnica'];
  const cells=occupied?.length?occupied.map(([x,z])=>`${x},${z}`):Array.from({length:cols*rows},(_,i)=>`${i%cols},${Math.floor(i/cols)}`);
  const occupiedSet=new Set(cells),wallByEdge=new Map(),exteriorEdges=[];
  for(let f=0;f<floors;f++){
    const fid=`f${f+1}`;levels.push({id:fid,nome:f===0?'Térreo':`${f+1}º pavimento`,cota:Number((f*height).toFixed(4)),altura:height});
    const node=(x,z)=>`${fid}_n${x}_${z}`;
    for(let x=0;x<=cols;x++)for(let z=0;z<=rows;z++)nodes.push({id:node(x,z),pavimentoId:fid,x:Number((x*dx).toFixed(4)),z:Number((z*dz).toFixed(4))});
    const addWall=(id,x1,z1,x2,z2)=>{
      const ax=x1*dx,az=z1*dz,bx=x2*dx,bz=z2*dz,wallId=`${fid}_${id}`;
      elements.push({id:wallId,pavimentoId:fid,tipo:'PAREDE',nome:`Alvenaria ${id}`,x:Number(((ax+bx)/2).toFixed(4)),z:Number(((az+bz)/2).toFixed(4)),base:0,largura:Number(Math.hypot(bx-ax,bz-az).toFixed(4)),profundidade:0.18,altura:height,rotacao:Number((-Math.atan2(bz-az,bx-ax)*180/Math.PI).toFixed(4)),cor:'#cbd5e1',paredeId:null,deslocamento:0,noInicioId:node(x1,z1),noFimId:node(x2,z2)});
      return wallId;
    };
    const wallFor=(axis,x,z)=>{
      const key=`${axis}:${x}:${z}`;if(wallByEdge.has(`${fid}:${key}`))return wallByEdge.get(`${fid}:${key}`);
      const id=axis==='h'?addWall(`h${x}_${z}`,x,z,x+1,z):addWall(`v${x}_${z}`,x,z,x,z+1);
      wallByEdge.set(`${fid}:${key}`,id);return id;
    };
    for(const [ix,cell] of cells.entries()){
      const [x,z]=cell.split(',').map(Number),name=roomNames[ix%roomNames.length];
      const top=wallFor('h',x,z),right=wallFor('v',x+1,z),bottom=wallFor('h',x,z+1),left=wallFor('v',x,z);
      rooms.push({id:`${fid}_a${x}_${z}`,pavimentoId:fid,nome:name,x:Number(((x+.5)*dx).toFixed(4)),z:Number(((z+.5)*dz).toFixed(4)),paredeIds:[top,right,bottom,left]});
      const neighbours=[[x,z-1,top],[x+1,z,right],[x,z+1,bottom],[x-1,z,left]];
      for(const [nx,nz,wallId] of neighbours)if(!occupiedSet.has(`${nx},${nz}`))exteriorEdges.push(wallId);
    }
    const pillarPositions=[...new Map(cells.flatMap(cell=>{const [x,z]=cell.split(',').map(Number);return [[x,z],[x+1,z],[x,z+1],[x+1,z+1]];}).map(point=>[point.join(','),point])).values()];
    for(const [i,[x,z]] of pillarPositions.entries())elements.push({id:`${fid}_p${i}`,pavimentoId:fid,tipo:'PILAR',nome:'Pilar estrutural demonstrativo',x:Number((x*dx).toFixed(4)),z:Number((z*dz).toFixed(4)),base:0,largura:0.35,profundidade:0.35,altura:height,rotacao:0,cor:'#64748b',paredeId:null,deslocamento:0,noInicioId:null,noFimId:null});
    // Anchored openings make the plan readable and keep doors/windows on their host walls.
    const outside=[...new Set(exteriorEdges.filter(id=>id.startsWith(`${fid}_`)))];
    for(let i=0;i<Math.min(3,outside.length);i++){
      const wall=elements.find(e=>e.id===outside[i]);
      elements.push({id:`${fid}_d${i}`,pavimentoId:fid,tipo:'PORTA',nome:i===0?'Entrada principal':'Porta interna',x:0,z:0,base:0,largura:1,profundidade:0.18,altura:2.15,rotacao:0,cor:'#a78055',paredeId:wall.id,deslocamento:Math.min(1,wall.largura*.3),noInicioId:null,noFimId:null});
    }
    for(let i=3;i<Math.min(9,outside.length);i++){
      const wall=elements.find(e=>e.id===outside[i]);
      elements.push({id:`${fid}_w${i}`,pavimentoId:fid,tipo:'JANELA',nome:'Janela de iluminação natural',x:0,z:0,base:1.05,largura:1.4,profundidade:0.18,altura:1.2,rotacao:0,cor:'#74b9e8',paredeId:wall.id,deslocamento:Math.min(1,wall.largura*.35),noInicioId:null,noFimId:null});
    }
    // Large slabs emphasize open industrial/urban spaces in the 3D view.
    if(kind==='galpao'||kind==='praca')for(const [i,cell] of cells.entries()){
      const [x,z]=cell.split(',').map(Number);
      elements.push({id:`${fid}_laje_${i}`,pavimentoId:fid,tipo:'LAJE',nome:kind==='praca'?'Piso público pavimentado':'Piso industrial reforçado',x:Number(((x+.5)*dx).toFixed(4)),z:Number(((z+.5)*dz).toFixed(4)),base:0,largura:dx,profundidade:dz,altura:.12,rotacao:0,cor:kind==='praca'?'#d6d3d1':'#94a3b8',paredeId:null,deslocamento:0,noInicioId:null,noFimId:null});
    }
  }
  for(let i=0;i<Math.min(6,nodes.length-1);i+=2)dimensions.push({id:`c${i}`,pavimentoId:nodes[i].pavimentoId,tipo:'ALINHADA',ax:nodes[i].x,az:nodes[i].z,bx:nodes[i+1].x,bz:nodes[i+1].z,afastamento:-.35,noAId:nodes[i].id,noBId:nodes[i+1].id});
  return {schemaVersao:2,pavimentos:levels,nos:nodes,elementos:elements,ambientes:rooms,cotas:dimensions};
}

const archetypes=[
  {title:'Casa térrea contemporânea',floors:1,width:16,depth:13,height:3.1,cols:4,rows:3,occupied:[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[1,2]],names:['Garagem','Estar e jantar','Cozinha','Suíte','Quarto','Banheiro','Lavanderia','Varanda'],kind:'casa'},
  {title:'Condomínio vertical — pavimento tipo',floors:6,width:36,depth:24,height:2.9,cols:5,rows:3,occupied:[[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2]],names:['Apto 01 — estar','Apto 01 — dormitórios','Apto 02 — estar','Apto 02 — dormitórios','Apto 03 — estar','Apto 03 — dormitórios','Apto 04 — estar','Apto 04 — dormitórios','Hall de elevadores','Escada protegida','Prumadas técnicas','Circulação','Sacada técnica'],kind:'condominio'},
  {title:'Edifício comercial — escritórios',floors:4,width:34,depth:18,height:3.6,cols:5,rows:3,occupied:[[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2]],names:['Recepção','Escritório aberto','Sala de reunião','Escritório aberto','Copa','Sanitário acessível','Hall de elevadores','Núcleo técnico','Terraço','Sala de foco','Arquivo'],kind:'comercial'},
  {title:'Residência familiar — planta alternativa',floors:2,width:18,depth:16,height:3,cols:4,rows:4,occupied:[[0,0],[1,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2],[3,2],[3,3]],names:['Sala de estar','Jantar','Cozinha','Suíte','Quarto','Banheiro','Sala íntima','Escritório','Terraço','Garagem'],kind:'casa'},
  {title:'Galpão logístico — armazenagem e docas',floors:1,width:72,depth:32,height:10,cols:6,rows:3,occupied:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[2,2],[3,2],[4,2],[5,2]],names:['Armazenagem central','Armazenagem central','Separação de pedidos','Expedição','Doca de carga','Doca de descarga','Administração','Vestiário','Sala técnica','Pátio coberto','Manutenção','Recebimento','Câmara fria','Conferência','Carga pesada','Apoio logístico'],kind:'galpao'},
  {title:'Vila de casas e praça central',floors:1,width:54,depth:42,height:4,cols:6,rows:5,occupied:[[0,0],[1,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[3,2],[4,2],[2,3],[3,3],[4,3],[2,4],[3,4]],names:['Casa A — estar','Casa A — dormitório','Casa B — estar','Casa B — dormitório','Pavilhão comunitário','Praça central','Playground','Apoio','Bicicletário','Jardim','Pérgola','Quiosque','Quadra','Caminho','Espelho d’água','Palco','Área de leitura','Banheiro público','Feira'],kind:'praca'},
];

let updated=0;
for(let p=0;p<6;p++)for(let m=0;m<2;m++){
  const key=`modelo_${p}_${m}`,entry=state.registros[key];assert(entry?.id,`Modelo ${key} ausente no estado da demonstração.`);
  if(state.registros[`diversificacao_v3_${p}_${m}`]?.id===entry.id)continue;
  const model=await api(`/workspace/modelador/modelos/${entry.id}`);
  const a=archetypes[p];
  const plan={...a,floors:m===0?a.floors:Math.max(1,a.floors-1)};
  if(m===1&&plan.occupied?.length>5)plan.occupied=plan.occupied.slice(0,-1);
  const result=await api(`/workspace/modelador/modelos/${entry.id}`,'PUT',{versao:model.versao,nome:`${a.title} — estudo ${m+1}`,motivo:'Revisão de demonstração: implantação, tipologia e geometria diferenciadas.',documento:documentPlan(plan)});
  state.registros[`diversificacao_v3_${p}_${m}`]={id:entry.id,revisao:result.revisao,tipo:a.kind};updated++;await persist();
}

const projects=[
  {key:'projeto_escola_demo',name:'Escola Parque Horizonte — Demonstração',area:6800,vgv:0,model:'Escola pública — campus e salas de aula',floors:2,width:40,depth:28,height:3.6,cols:4,rows:3,occupied:[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2]],kind:'escola',names:['Recepção','Sala de aula 01','Sala de aula 02','Sala de aula 03','Biblioteca','Laboratório','Refeitório','Coordenação','Sanitário acessível','Pátio coberto']},
  {key:'projeto_hospital_demo',name:'Hospital Regional Horizonte — Demonstração',area:14800,vgv:0,model:'Hospital — urgência e bloco assistencial',floors:3,width:48,depth:36,height:4,cols:4,rows:4,occupied:[[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[1,3],[2,3]],kind:'hospital',names:['Pronto atendimento','Triagem','Consultório','Imagem','Centro cirúrgico','Recuperação','UTI','Posto de enfermagem','Apoio limpo','Apoio sujo','Internação','Elevadores clínicos','Farmácia','Esterilização']},
  {key:'projeto_praca_demo',name:'Praça das Acácias — Demonstração',area:5200,vgv:0,model:'Praça pública — lazer e paisagismo',floors:1,width:60,depth:48,height:4,cols:5,rows:4,occupied:[[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[1,3],[2,3],[3,3]],kind:'praca',names:['Esplanada central','Pavilhão coberto','Palco aberto','Playground','Quadra multiuso','Quiosque','Sanitário público','Bicicletário','Jardim de chuva','Espelho d’água','Pérgola','Área de leitura','Academia ao ar livre','Caminho acessível','Jardim sensorial','Feira comunitária']},
];
const engineers=await api('/workspace/engenheiros');const engineer=engineers[0];assert(engineer,'Empresa demonstrativa sem engenheiro ativo.');
for(const p of projects){
  let project=state.registros[p.key];
  if(!project?.id){
    project=await api('/workspace/projetos','POST',{nome:p.name,engenheiroResponsavelId:engineer.id,vgvEstimado:p.vgv,areaTotalM2:p.area,dataInicio:today,dataPrevisaoFim:endDate});
    state.registros[p.key]={id:project.id,nome:project.nome};await persist();
  }
  const modelKey=`modelo_${p.key}`;
  let model=state.registros[modelKey];
  if(!model?.id){
    model=await api('/workspace/modelador/modelos','POST',{projetoObraId:project.id,nome:p.model});
    state.registros[modelKey]={id:model.id,nome:p.model};await persist();
  }
  const verificationKey=`planta_diversa_v3_${p.key}`;
  if(!state.registros[verificationKey]){
    const current=await api(`/workspace/modelador/modelos/${model.id}`);
    const saved=await api(`/workspace/modelador/modelos/${model.id}`,'PUT',{versao:current.versao,nome:p.model,motivo:'Modelo demonstrativo de equipamento público com ambientes e dimensões próprios.',documento:documentPlan(p)});
    state.registros[verificationKey]={projectId:project.id,modelId:model.id,revisao:saved.revisao,tipo:p.kind};await persist();
  }
  console.log(`Gravado: ${p.name} / ${p.model}`);
}
const allModelIds=[];
for(let p=0;p<6;p++)for(let m=0;m<2;m++)allModelIds.push(state.registros[`modelo_${p}_${m}`].id);
for(const p of projects)allModelIds.push(state.registros[`modelo_${p.key}`].id);
for(const id of allModelIds){
  const detail=await api(`/workspace/modelador/modelos/${id}`);
  assert(detail.documento.pavimentos.length>=1&&detail.documento.elementos.length>=20&&detail.documento.ambientes.length>=4,`Modelo ${id} sem geometria diversificada suficiente.`);
}
assert.equal(new Set(allModelIds).size,15,'Os quinze modelos não têm IDs distintos.');
state.verificacao={...state.verificacao,modelosConferidosDiversos:true,versaoModelosDiversos:3,totalModelosDiversos:15,modelosDiversificadosEm:new Date().toISOString(),dadosFicticios:true,ambiente:'HOMOLOGACAO'};
await persist();
console.log(JSON.stringify({modelosExistentesAtualizados:updated,novosEmpreendimentos:projects.length,totalModelos:15,empresaId:state.empresaId},null,2));
