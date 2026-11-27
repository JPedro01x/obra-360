# Operação de produção

## Topologia e perfis de banco

O caminho suportado para o piloto é um único host com Docker Compose: o serviço `db` usa PostgreSQL 18.6; `app` executa Spring Boot no perfil `prod`, aplica as migrações Flyway e mantém os documentos no volume `documents`; `proxy` usa Caddy para HTTPS. O PostgreSQL fica somente na rede interna `database`, e apenas o proxy publica as portas 80 e 443. A aplicação não publica sua porta diretamente. O diretório local de documentos exige **uma única instância escritora**; não aumente réplicas nem compartilhe esse volume entre hosts. A rede `172.30.86.0/24` configurada no Compose precisa estar livre no host.

### Pacote de validação do piloto

Na raiz da fonte, execute `npm run piloto:validar`. O comando calcula um SHA-256 determinístico do snapshot da fonte (sem `.env`, credenciais, bancos locais, `node_modules`, `dist` ou artefatos temporários), registra o commit Git quando disponível e executa typecheck, build, política de entrega, jornada de dispositivo modesto, `mvn verify` e a suíte PostgreSQL isolada. O relatório JSON fica em `test-results/pilot-readiness-<data>.json`; valide esse arquivo junto com os logs da execução.

O manifesto também registra a versão do `package.json`, a versão do Docker Compose, os hashes de `Dockerfile` e do Compose, se a imagem foi construída neste snapshot, seu ID quando retornado e o estado/saúde observado dos serviços. A fotografia de serviços é apenas do instante da verificação. Comando ausente, falha, interrupção, timeout, configuração privada ausente ou evidência humana pendente bloqueia o status completo; `--no-validation` é somente diagnóstico e não pode aprovar a entrega. O manifesto inclui seu próprio caminho relativo para arquivamento.

O aceite humano fica pendente por padrão mesmo com um relatório estruturalmente completo. Depois de conferir as evidências do piloto, o operador pode executar `npm run piloto:validar -- --confirm-human-acceptance`, com `PRODUCTION_PILOT_REPORT` apontando para o JSON de aceite completo. A flag registra uma declaração explícita do operador; não verifica autenticidade das evidências de forma independente e não substitui aprovação organizacional. O relatório técnico datado em `docs/VALIDACAO-TECNICA-PILOTO-*.md` documenta evidências dessa cópia e não substitui o manifesto gerado por uma execução completa.

O serviço `app` do Compose compila uma imagem Docker diretamente deste snapshot, usando `Dockerfile` e `deploy/compose.production.yml`. Ele não instala o `bundle/obra360.tar.gz` criado pelo empacotador Java. Para validar a configuração e também construir a mesma imagem do caminho de implantação, configure `OBRA360_COMPOSE_ENV` com o caminho do `.env.production` privado e execute `npm run piloto:validar -- --build-compose`. A configuração Compose não imprime os valores do arquivo privado; nunca copie o conteúdo dele para o relatório.

Sem Docker, arquivo de ambiente privado, aceite preenchido ou declaração do operador sobre a restauração, o relatório permanece `INCOMPLETO`. Mesmo quando todas as verificações locais passam, o resultado é `APTO_PARA_REVISAO_DO_PILOTO`, não autorização automática para publicar: ainda é necessário revisar evidências no host de pré-produção, restaurar um backup nesse ambiente e obter o aceite dos usuários. Interrupção ou timeout de validação contam como falha.

O desenvolvimento (`npm run dev`) usa H2 persistente local; os testes usam banco isolado. Produção usa PostgreSQL e Flyway. Trocar o perfil ou o mecanismo de banco não transfere os dados do H2. Não conecte o procedimento de produção à base local nem use credenciais de teste.

## Preparação, provisionamento e liberação

Siga esta ordem para cada empresa:

1. **Prepare o destino e os segredos.** Defina o host, domínio/DNS, firewall, espaço em disco e responsáveis. Decida se o piloto precisa de e-mail/SMTP. Copie `deploy/production.example.env` para um arquivo privado `.env.production`, fora do pacote e do controle de versão, e preencha os valores próprios. Não coloque segredos no frontend, em arquivos versionados, no histórico do shell ou em logs. Restrinja leitura do arquivo ao operador autorizado e use um cofre para preservar senhas e chaves.
2. **Valide a configuração e prepare imagem e banco.** A partir da raiz do projeto, com Docker Compose disponível e o arquivo privado preparado, use os comandos de preflight e build da [instalação para o piloto](ENTREGA.md#instalação-para-o-piloto). Suba primeiro apenas `db` e espere o healthcheck. A aplicação ainda não deve receber tráfego público.
3. **Provisione a empresa pelo comando de operador.** Execute a ação `criar-empresa` no contêiner `app`, usando `--spring.profiles.active=prod,operador` e `--spring.main.web-application-type=none`, como documentado em [ENTREGA.md](ENTREGA.md#instalação-para-o-piloto). Injete os campos `OP_*` exigidos pelo [procedimento de provisionamento](COMERCIALIZACAO.md#provisionar-uma-empresa-ou-ajustar-limites) somente para essa execução. O comando é sem servidor HTTP; a base de destino deve ser PostgreSQL. Confirme e registre o ID retornado e os limites. Não habilite a configuração inicial pública: o Compose define `OBRA360_SETUP_ENABLED=false`.
4. **Libere app e proxy e confira o ambiente.** Suba os serviços seguindo a sequência de [ENTREGA.md](ENTREGA.md#instalação-para-o-piloto). Antes de entregar a URL, confira certificado, login, saúde, armazenamento e os serviços externos que fazem parte do piloto. O endpoint de prontidão é `GET /actuator/health/readiness`; o healthcheck interno do Compose verifica esse caminho.
5. **Entregue o acesso administrativo em privado.** Confirme a identidade do destinatário. Informe a URL HTTPS e o e-mail da conta `SUPER_ADMIN`; envie a senha inicial por canal privado separado e oriente a troca em **Minha senha**. Não reutilize, envie em grupo ou registre essa senha em ticket/log.
6. **Cadastre funcionários e convide o cliente externo.** O administrador da empresa cadastra e vincula os funcionários conforme [acesso RH](RH-ACESSO-FUNCIONARIO.md). Para o dono da casa, use o fluxo de [acesso do proprietário à unidade](OPERACAO.md#acesso-do-proprietário-à-unidade): convide como `CLIENTE`, associe à unidade correta e publique a revisão da planta que deve ser visualizada. Confirme o destinatário antes de compartilhar convite. O proprietário vê os dados publicados e autorizados da unidade, não a área administrativa da empresa.

O arquivo de ambiente de exemplo define `APP_DOMAIN`, `POSTGRES_PASSWORD` e `JWT_SECRET` para domínio e conexão/sessão; limites globais e por empresa de documentos; `SHARED_USAGE_LIMITS_ENABLED` e o segredo próprio `SHARED_USAGE_LIMITS_SECRET`; e a decisão e os parâmetros SMTP (`EMAIL_ENABLED`, `SMTP_*`, `EMAIL_FROM`). Compose deriva `APP_PUBLIC_URL` e `CORS_ALLOWED_ORIGINS` de `APP_DOMAIN`, fixa o perfil de produção, o endereço interno do banco, o diretório persistente e a configuração de encaminhamento do proxy. Os campos `PRODUCTION_PILOT_REPORT`, `PRODUCTION_RELEASE_JAR` e `PRODUCTION_DEPENDENCY_REPORT` são caminhos locais privados de evidências para verificação, não segredos nem flags de aprovação. Consulte sempre os comentários do arquivo de exemplo; não cole seus valores em documentação ou chamados.

O cadastro de novas empresas não é público nem feito pelo administrador de outra empresa. Cada nova empresa exige ação pontual de um operador do servidor e um novo administrador inicial. Os administradores ficam limitados à própria empresa para as operações cotidianas.

### Checklist de pré-publicação

- Confirme domínio próprio, DNS público apontando ao host e acesso externo às portas TCP 80/443 para o proxy/Caddy obter e renovar TLS. Reserve a sub-rede Docker `172.30.86.0/24` usada no Compose.
- Defina as regras de firewall, responsável primário e substituto do host, operador de produção e administrador da empresa. O banco não deve ter porta publicada para a Internet.
- Gere e injete `POSTGRES_PASSWORD`, `JWT_SECRET` e `SHARED_USAGE_LIMITS_SECRET` exclusivos do ambiente por um cofre ou mecanismo privado. O segredo de limite compartilhado deve ter pelo menos 32 bytes; não reutilize as chaves. Limite acesso ao `.env.production` e não o inclua no artefato.
- Registre a decisão de SMTP. Se habilitar recuperação por e-mail, homologue envio, domínio remetente e recebimento antes de entregar contas; defina também como a equipe trata falhas de e-mail. Com SMTP desligado, não prometa recuperação automática por e-mail.
- Dimensione disco para PostgreSQL, documentos, logs locais e crescimento previsto. Defina alertas de ocupação, uma cópia criptografada fora do host, retenção, responsáveis e teste de recuperação. O comando de backup gera arquivos sem criptografia; proteja-os antes de armazená-los ou transportá-los externamente.
- Identifique o commit e o JAR da entrega. Em um checkout Git autorizado, `npm run release:package` gera o pacote versionado em `releases/<id>` e a evidência de dependências. Confirme os hashes e execute o pipeline CI do mesmo commit. O pacote não deve conter ambiente ou credenciais privadas.
- Em máquina isolada com JDK 21, Node/dependências do projeto e a pasta do bundle, execute `npm run test:preproduction -- "releases/<id>/bundle"`. Esse laboratório usa PostgreSQL embutido, TLS e dados descartáveis em loopback; não requer nem deve receber credenciais ou dados do cliente.
- Preencha o relatório de aceite do piloto com responsáveis e evidências reais, revise os limites de segurança/privacidade e registre a janela de mudança, plano de retorno e contato de suporte. O verificador de configuração não substitui essas aprovações.

**A publicação deste projeto continua pendente.** Não há host, domínio/DNS, firewall, arquivo privado de produção, SMTP decidido/homologado, segredo de produção, restauração exercitada nem aceite de cliente real fornecidos nesta cópia. Não direcione tráfego público até preencher esses pré-requisitos e completar a lista de aceite da [entrega do piloto](ENTREGA-PILOTO.md). O comando `npm run verificar:producao` informa pendências de configuração; não substitui homologação de provedor, teste de restauração, revisão independente ou aceite do cliente.

## Backup

Para a configuração Compose com documentos no volume local, use uma janela acordada e configure `OBRA360_COMPOSE_ENV` para o `.env.production` privado e `OBRA360_BACKUP_DIR` para uma pasta privada fora dos volumes. No PowerShell, a partir da raiz do projeto:

```powershell
$env:OBRA360_COMPOSE_ENV = 'C:\caminho-privado\.env.production'
$env:OBRA360_BACKUP_DIR = 'D:\backups-privados\obra360'
npm run backup:production -- --janela-de-manutencao
```

O script exige exatamente uma instância `app` em execução e a interrompe para alinhar `pg_dump` com os documentos do volume. Valida os arquivos e grava `postgres.dump`, `documentos.tar.gz` e `manifesto.json` numa subpasta identificada por data UTC. Tenta iniciar a aplicação ao terminar, inclusive em caso de erro depois de pará-la. Confirme o resultado e a prontidão antes de encerrar a janela. A cópia não é criptografada pelo script: proteja os arquivos, criptografe-os antes de enviá-los a armazenamento externo e mantenha controle de acesso e retenção definidos. Preserve a versão da aplicação e a chave JWT num cofre separado. Restrinja a execução a um operador autorizado.

## Restauração

Use um host isolado, volumes novos, a mesma versão da entrega e a mesma versão principal do PostgreSQL. Confira o manifesto, tamanhos e SHA-256 com `npm run backup:production -- --verify "/caminho/do/backup"`; essa verificação confirma os arquivos contra o manifesto, mas não prova que a aplicação inteira pode ser recuperada. Prepare um `.env.restore` privado com os valores próprios do ambiente isolado e injete as chaves originais a partir do cofre, incluindo o `JWT_SECRET` necessário para compatibilidade. Execute os comandos abaixo em um checkout da fonte correspondente ao release (com `Dockerfile` e `deploy/compose.production.yml`); o bundle executável, sozinho, não contém esses arquivos de Compose. Os comandos usam Bash e constroem a imagem para o projeto de restauração antes de criar volumes novos:

```bash
compose=(docker compose --project-name obra360-restore --env-file .env.restore -f deploy/compose.production.yml)
"${compose[@]}" config --quiet
"${compose[@]}" build app
"${compose[@]}" up -d --wait db
"${compose[@]}" exec -T db pg_restore -U obra360 -d obra360 --single-transaction --exit-on-error --no-owner --no-acl < postgres.dump
"${compose[@]}" run --rm --no-deps -T --entrypoint tar app -xzf - -C /app/data < documentos.tar.gz
"${compose[@]}" up -d --wait app
```

Confira a prontidão da aplicação, autenticação com senha, abertura de obras, permissão de um perfil restrito e download de um documento com hash conhecido. Registre a idade da cópia e a duração da recuperação. Só direcione tráfego ao ambiente recuperado após os checks de dados, permissões e HTTPS. Para voltar de uma atualização com migração incompatível, restaure a cópia anterior à mudança em um ambiente separado antes de redirecionar tráfego.

O ensaio local `npm run test:preproduction -- "releases/<id>/bundle"` cria PostgreSQL e TLS descartáveis em loopback. Ele testa o pacote Java e a recuperação por cópia física do cluster parado e dos arquivos. Execute também o procedimento de restauração lógica acima no ambiente de pré-produção para validar `pg_dump`, `pg_restore` e os volumes do Compose.

O CI contém um ensaio Compose separado (`scripts/ci-production-smoke.sh`) que cria projeto, volumes, segredos e registros sintéticos próprios, executa `backup:production`, restaura o dump e os documentos em volumes novos e compara o arquivo recuperado. Use o resultado do CI referente ao commit da entrega; a existência do workflow não prova que uma execução passou. Nunca execute esse ensaio, um restore de verificação ou script destrutivo contra a base persistente local ou o host ativo.

## Monitoramento e capacidade

Configure o monitor externo para fazer GET em `/actuator/health/readiness` por HTTPS com validação de certificado. Trate HTTP diferente de 200, corpo com `status` diferente de `UP` ou falha de conexão como indisponibilidade. Acompanhe taxa de respostas 5xx, latência, uso de disco e idade da última cópia verificada. Nomeie o responsável, o substituto e o canal de atendimento. Combine com o piloto metas de recuperação e volume simultâneo. Faça o teste de carga com a quantidade de usuários, arquivos e operações esperados para o cliente, incluindo criação, edição e download. O ensaio local registra a latência de um arquivo pequeno em loopback.

O comando `npm run monitorar:producao -- https://seu-dominio` emite JSON com prontidão, código HTTP e latência. Ele retorna código 1 para falha de prontidão e 2 para endereço inválido. Ele não agenda a checagem nem envia alerta; no serviço escolhido, agende a verificação HTTPS e associe os resultados a um responsável e ao canal de atendimento da equipe.

Registre o incidente com horário, versão, impacto e ações. Preserve os logs necessários para diagnóstico, com acesso restrito e sem dados de login, tokens ou segredos.
