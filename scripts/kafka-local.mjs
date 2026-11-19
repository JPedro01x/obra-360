import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useLocalJava21 } from './local-java.mjs';

// Local development broker, using the actual Kafka server jars resolved by Maven.
// Data survives restarts. Production/container installation uses compose.messaging.yml.
const root=fileURLToPath(new URL('../',import.meta.url));
const backend=path.join(root,'obra360-backend');
const directory=path.join(backend,'data','kafka');
const exists=async file=>access(file).then(()=>true,()=>false);
const busy=await new Promise(resolve=>{
  const socket=createConnection({host:'127.0.0.1',port:9092});
  socket.setTimeout(1000);socket.once('connect',()=>{socket.destroy();resolve(true);});
  socket.once('error',()=>resolve(false));socket.once('timeout',()=>{socket.destroy();resolve(false);});
});
if(busy)throw new Error('Porta 9092 já está ocupada. Nenhum processo existente foi alterado.');
const home=await useLocalJava21();
const java=path.join(home,'bin',process.platform==='win32'?'java.exe':'java');
await mkdir(directory,{recursive:true});
const run=(command,args,options={})=>new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd:backend,stdio:'inherit',windowsHide:true,...options});
  child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(`Processo encerrou com código ${code}.`)));
});
console.log('Preparando dependências do broker Kafka local pelo Maven.');
const repo=path.join(homedir(),'.m2','repository');
const mavenArgs=['--batch-mode','-q','dependency:build-classpath','-Dmdep.includeScope=test','-Dmdep.outputFile=target/kafka-local-classpath.txt'];
const mavenEnv={...process.env,MAVEN_OPTS:`${process.env.MAVEN_OPTS||''} "-Dmaven.repo.local=${repo}"`};
if(process.platform==='win32')
  await run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`mvn ${mavenArgs.join(' ')}`],{env:mavenEnv});
else await run('mvn',mavenArgs,{env:mavenEnv});
const classpath=(await readFile(path.join(backend,'target','kafka-local-classpath.txt'),'utf8')).trim();
// Pass Unicode paths directly to CreateProcess; Java @argfiles use a platform
// encoding that can corrupt Portuguese Windows account names.
if(process.platform==='win32' && classpath.length>29000)
  throw new Error('Classpath excede o limite local do Windows. Utilize deploy/compose.messaging.yml.');
const javaArgs=['-Xms128m','-Xmx512m','-cp',classpath];
const config=path.join(directory,'server.properties');
const logPath=directory.replaceAll('\\','/').replace(/[^\x20-\x7e]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
await writeFile(config,[
  'process.roles=broker,controller','node.id=1',
  'controller.quorum.voters=1@127.0.0.1:9093',
  'listeners=PLAINTEXT://127.0.0.1:9092,CONTROLLER://127.0.0.1:9093',
  'advertised.listeners=PLAINTEXT://127.0.0.1:9092',
  'controller.listener.names=CONTROLLER','listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT',
  'inter.broker.listener.name=PLAINTEXT',`log.dirs=${logPath}`,
  'offsets.topic.replication.factor=1','transaction.state.log.replication.factor=1',
  'transaction.state.log.min.isr=1','group.initial.rebalance.delay.ms=0',
  'num.partitions=1','log.retention.hours=168','log.retention.bytes=268435456',
  'log.segment.bytes=67108864','auto.create.topics.enable=false','delete.topic.enable=false',''
].join('\n'));
if(!await exists(path.join(directory,'meta.properties')))
  await run(java,[...javaArgs,'kafka.tools.StorageTool','format','-t',randomBytes(16).toString('base64url'),'-c',config]);
console.log('Iniciando Kafka em 127.0.0.1:9092. Ctrl+C encerra o broker; os dados serão preservados.');
await run(java,[...javaArgs,'kafka.Kafka',config]);
