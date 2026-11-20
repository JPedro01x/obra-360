# Preparação local para implantação, piloto e operação — 20/11/2026

Situação: preparação documental local. Ainda não há empresa piloto, pessoas nomeadas, contas de provedores ou ambiente definitivo disponibilizados. Não foram criadas contas, contratados serviços, enviados e-mails ou ativadas integrações nesta preparação. Nenhum item abaixo registra aprovação real.

A empresa fictícia persistida serve para demonstração e treinamento. Persistência no banco não comprova origem, conciliação ou aceite de dados reais. A instalação local H2 não é a instalação definitiva PostgreSQL. Os ensaios de 19/11 estão registrados em [VALIDACAO-OPERACIONAL-2026-11-19.md](VALIDACAO-OPERACIONAL-2026-11-19.md); não foram repetidos apenas para produzir este documento. A execução CI **44641496306** é uma referência de falha de baseline em investigação, não evidência de entrega aprovada. Registrar uma nova execução e seu resultado após a correção das dependências Docker/fusos e conferir os jobs obrigatórios.

## Dossiê privado a abrir quando houver cliente

Copiar [modelos/implantacao-cliente.json](modelos/implantacao-cliente.json) e [modelos/aceite-piloto.json](modelos/aceite-piloto.json) para uma pasta privada escolhida pelo responsável. Preservar os modelos versionados sem dados reais. Registrar empresa e autorização dos dados, versão/hash, módulos, destino, volume, responsáveis e substitutos, canais, metas de recuperação e condições comerciais. Credenciais ficam em cofre separado; evidências devem ter acesso restrito.

Para cada evidência registrar: ID do caso, versão/hash, ambiente, data/hora com fuso, executor, aprovador, entrada autorizada, resultado esperado/observado, referência ao arquivo/log sem segredos e eventual defeito/correção/reteste. No JSON existente usar `resultado`, `responsavel`, `aprovadoEm`, `evidencia` e `observacoes`; manter histórico complementar no dossiê. Não adicionar aprovações para contornar o verificador.

Nesta máquina, os dois modelos foram copiados para `piloto-operacional-2026-11-20.local/`, ignorado pelo Git. Nenhum formulário existente foi sobrescrito; o aceite vazio foi conferido e retorna código 1, como esperado. Essa pasta é um dossiê para preenchimento, não uma instalação nem um piloto aprovado.

## Responsabilidades propostas, ainda sem nomes

R = executa; A = decide/responde pelo resultado; C = consultado; I = informado. Todos os papéis abaixo precisam de titular e substituto reais. A matriz é proposta para pactuação, não atribuição de pessoas nem SLA.

| Atividade | R | A | C | I |
| --- | --- | --- | --- | --- |
| Autorizar dados e escopo do piloto | Gestores das áreas | Gestor do cliente | Privacidade/jurídico | Implantação |
| Instalar pacote, HTTPS, PostgreSQL e permissões | Implantação | Responsável técnico do destino | Operação e segurança independente | Gestor do cliente |
| Executar e aceitar os cenários | Usuários responsáveis das áreas | Gestor do cliente | Implantação, contabilidade e engenharia conforme caso | Atendimento |
| Homologar cada provedor | Administrador da conta e implantação | Gestor do cliente | Privacidade, segurança e fiscal para SEFAZ | Operação |
| Saúde, espaço, atualizações e acessos | Operador e substituto | Responsável técnico do destino | Implantação e gestores das áreas | Atendimento |
| Backup e recuperação | Operador de backup | Responsável técnico do destino | Gestor do cliente e implantação | Atendimento |
| Triar e escalar incidentes | Atendimento e operador | Responsável pelo incidente nomeado | Implantação, segurança e privacidade conforme impacto | Gestor do cliente |
| Avaliação independente e reteste | Avaliador externo à implementação | Contratante da avaliação | Implantação e operação | Gestor do cliente |

## Comandos existentes e ordem de uso

São instruções para o operador; esta preparação não executou instalação, restauração ou ativação. Pré-requisitos locais: Node `^20.19.0 || >=22.12.0`, JDK 21 e Maven. Docker/Compose são necessários para o fluxo de destino correspondente, não foram instalados aqui.

```powershell
cd "C:/Users/João Pedro/Downloads/claude"
# Somente em instalação nova ou após mudança do lockfile:
npm ci
npm run dev
# Em outro terminal, com API/interface prontas:
npm run diagnostico:local
npm run monitorar:local
npm run validar:local
```

Interface: `http://127.0.0.1:3000`; API: `http://127.0.0.1:8080`. Não iniciar outra instância nas mesmas portas. O monitor local roda no terminal a cada 60 segundos; não cria serviço ou notificação automática.

```powershell
# Primeiro inspecionar, depois encerrar apenas a execução identificada:
npm run parar:local
npm run parar:local -- --confirmar
# Com aplicação encerrada e banco sem outro usuário:
npm run backup
npm run backup:verificar -- IDENTIFICADOR_DA_COPIA
npm run dev
```

Restauração altera dados e exige seleção consciente da cópia e preservação do estado atual. Seguir [OPERACAO-LOCAL.md](OPERACAO-LOCAL.md), inclusive a cópia anterior e a conferência posterior:

```powershell
# Aplicação previamente encerrada:
npm run backup:verificar -- IDENTIFICADOR_DA_COPIA
npm run backup:restore -- IDENTIFICADOR_DA_COPIA --confirm
npm run dev
# Em outro terminal após prontidão:
npm run diagnostico:local
```

Para a entrega definitiva, seguir [ENTREGA-CORPORATIVA.md](ENTREGA-CORPORATIVA.md) e [OPERACAO-PRODUCAO.md](OPERACAO-PRODUCAO.md): base PostgreSQL separada, documentos em volume persistente, HTTPS, segredos privados, instalação inicial/demonstração desabilitadas, permissões do host, capacidade acordada e restauração lógica em volumes novos no destino. Não reaproveitar o cadastro fictício como cadastro validado do cliente.

```powershell
# Na validação da versão candidata, conforme as condições dos documentos:
npm run test:postgres
npm run test:integrated
# Aguardar fim da integrada: compartilham portas.
npm run test:roles
npm run release:package
npm run test:preproduction -- "releases/<id>/bundle"
npm run validar:piloto -- "C:/pasta-privada/aceite-piloto.json"
npm run verificar:producao
```

`<id>` e caminhos privados são substituições pelo operador. `PRODUCTION_RELEASE_JAR`, `PRODUCTION_DEPENDENCY_REPORT` e `PRODUCTION_PILOT_REPORT` precisam apontar para a entrega e evidências corretas. Auditoria Java/npm deve corresponder ao hash do JAR e estar dentro da validade exigida. `validar:piloto` retorna 0 apenas para declarações completas, 1 para pendências/reprovações e 2 para arquivo inválido; não autentica evidências nem certifica segurança. O modelo pendente deve continuar reprovando a liberação.

## Plano de aceite: 16 casos pendentes

Todas as linhas estão **PENDENTE** até execução e decisão humana com dados autorizados. Para todas se aplicam os campos de evidência descritos acima e os critérios completos de [PILOTO-COMERCIAL.md](PILOTO-COMERCIAL.md).

| ID | Exercício/evidência mínima a obter | Papel executor proposto | Estado |
| --- | --- | --- | --- |
| cadastros | Origem e conferência de usuários, fornecedores, materiais e saldos | Administração e gestores | PENDENTE |
| perfis | Matriz de ações permitidas/negadas, saída e troca de senha | Administrador e usuários de cada perfil | PENDENTE |
| projetos | Criar/editar obra, validar prazos e preservar datas históricas | Engenharia/gerência | PENDENTE |
| equipes_os | Contrato filtra equipe; troca limpa vínculo; execução, consumo e encerramento | Engenharia/encarregado | PENDENTE |
| compras_estoque | Aprovação distinta, recebimento idempotente, saldo/custo e saldo insuficiente | Compras/almoxarifado | PENDENTE |
| documentos | Versão e hash do download; tentativa de acesso indevido negada | Gestor documental | PENDENTE |
| rh_administrativo | Acesso inicial privado, troca obrigatória, ponto/ausências e desligamento | RH | PENDENTE |
| plantas | Referência calibrada, edição 2D/3D, reabertura/revisão, publicação restrita e impressão física | Modelagem/engenharia | PENDENTE |
| isolamento_empresas | Duas empresas: registros, seletores e arquivos sem exposição cruzada | Implantação e gestores autorizados | PENDENTE |
| recuperacao_senha | E-mail real, uso único, expiração e invalidação de sessões | Administrador e usuário autorizado | PENDENTE |
| backup_restauracao | Banco/documentos/configuração em ambiente separado; tempos, hashes e perda medida | Operação de backup | PENDENTE |
| capacidade | Volume acordado, operações de leitura/escrita/upload/download e metas medidas no destino | Operação e usuários | PENDENTE |
| atendimento | Abertura/resposta, isolamento e exportação; canal externo confirmado | Atendimento/administrador | PENDENTE |
| orcamento_financeiro | Revisão aprovada, títulos, baixa parcial/estorno e saldos contra fontes | Financeiro e contabilidade | PENDENTE |
| pedidos_multiplos | Duas aprovações, vários itens, parcial/devolução, custo e crédito | Compras/almoxarifado/financeiro | PENDENTE |
| conciliacao | Extrato autorizado, ausência de duplicação, sinal/conta/valor, conciliar/desfazer | Financeiro | PENDENTE |

## Homologação dos provedores: roteiro para quando houver contas

Nenhuma conexão real é declarada. As variáveis abaixo foram inventariadas apenas de `obra360-backend/.env.example` e da documentação; os arquivos `.env` reais não foram lidos. Manter `AI_ENABLED`, `EMAIL_ENABLED` e `SEFAZ_ENABLED` desativados até autorização/configuração e ensaio controlado. Google requer conta/configuração e vínculo explícito; não habilitar por associação silenciosa de e-mail.

| Provedor | Dependência e nomes de configuração | Evidência local já descrita, limite | Casos reais e critério de saída pendentes |
| --- | --- | --- | --- |
| E-mail | Conta SMTP autorizada, remetente e URL HTTPS; `EMAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_STARTTLS`, `SMTP_SSL`, `EMAIL_FROM`, `APP_PUBLIC_URL` | Captura SMTP em loopback com `@test.invalid`; não prova entrega | Entrega ao destinatário autorizado, remetente/link corretos, TLS, token único/expirado e revogação das sessões; falha do provedor tratada sem vazar existência de conta; operador registra aceite e canal para falhas |
| Google | Projeto/cliente OAuth Web autorizado, origens e e-mail verificado; `GOOGLE_CLIENT_ID`, `CORS_ALLOWED_ORIGINS` | JWKS/assinatura de teste; não prova configuração do cliente real | Vincular após login por senha, entrar na conta vinculada e negar token com audiência/emissor/nonce/validade incorretos ou conta não vinculada; registrar configuração de origens e aceite sem copiar tokens |
| IA | Conta/modelo autorizado, política de dados, orçamento e consentimento; `AI_ENABLED`, `OPENAI_API_KEY`, `AI_MODEL`, `AI_MAX_OUTPUT_TOKENS` | Testes HTTP Responses locais; não provam conta/modelo ou faturamento | Pergunta autorizada com consentimento, ausência de envio automático de cadastros, resposta e tratamento de quota/indisponibilidade, limite de uso e orçamento acordado; confirmar política e conta antes de incluir na oferta |
| SEFAZ | Responsável fiscal, autorizador oficial NFeConsultaProtocolo4 e A1 PKCS12 da empresa; `SEFAZ_ENABLED`, `SEFAZ_URL`, `SEFAZ_A1_PATH`, `SEFAZ_A1_PASSWORD`, `SEFAZ_EMPRESA_ID`, `SEFAZ_AMBIENTE` | SOAP/XML de teste e bloqueio de entidades externas; não prova certificado nem autorizador real | Em homologação (`2`), consultar chave autorizada para ensaio, conferir protocolo/situação com responsável fiscal e tratar certificado/ambiente/empresa/indisponibilidade incorretos; mudança para produção (`1`) depende de aprovação específica e teste do destino |

Não versionar chaves, senhas, certificados, tokens ou mensagens com dados reais. Não usar segredos em `VITE_`. SEFAZ consulta situação/protocolo: não emite nota, baixa XML ou importa itens/valores. Saída por provedor exige executor/aprovador reais, data, versão, ambiente, evidências de sucesso/negação/falha, plano de desativação e responsável de operação. Provedor opcional sem homologação fica fora do escopo contratado; recuperação por e-mail exige entrega comprovada antes da liberação aos usuários.

## Rotina proposta para pactuar com o cliente

Proposta inicial, sem serviço agendado nem compromisso contratual: operador verifica saúde/espaço/cópia no início e fim de cada dia de uso; backup completo diário em janela acordada, com verificação e cópia protegida fora do host; retenção inicial sugerida de sete diárias e quatro semanais, ajustada ao volume e política de dados. O intervalo entre cópias deve ser reduzido se a perda máxima aceita exigir; backup diário não garante perda menor que 24 horas. Diagnóstico local usa alerta de cópia acima de 48 horas e espaço livre abaixo de 2 GB, limites técnicos que não definem metas do cliente.

Propor ensaio mensal de recuperação em ambiente separado e também antes de atualização relevante. Registrar duração, idade da cópia, banco/documentos/configuração, hashes, permissões e aceite do retorno. Definir RPO e RTO com o cliente após medir o destino; não prometer os tempos do laboratório. No Compose, `npm run backup:production -- --janela-de-manutencao` usa `OBRA360_COMPOSE_ENV` e `OBRA360_BACKUP_DIR`; a verificação existente é `npm run backup:production -- --verify "CAMINHO_PRIVADO_DA_COPIA"`. Seguir o procedimento completo de produção, inclusive reinício e restauração lógica isolada.

Propor monitoramento contínuo de prontidão no destino, revisão diária de alertas e revisão semanal de falhas, espaço, acessos/desligamentos e pendências. O comando existente `npm run monitorar:producao -- https://seu-dominio` é uma checagem com resultado; agendamento, destino de alertas e pessoas ainda precisam ser definidos. Para indisponibilidade geral, suspeita de exposição ou corrupção: suspender a operação afetada, preservar horários/logs sem segredos, acionar operador e substituto pelo canal externo, escalar à implantação/segurança/privacidade conforme impacto e registrar decisão antes de recuperar. Divergência de área vai ao seu gestor e atendimento. Prazos de resposta e comunicação são pendentes de acordo; não existe plantão contratado nesta preparação.

Treinamento proposto antes do piloto: sessões por perfil do [TREINAMENTO-E-ENTREGA.md](TREINAMENTO-E-ENTREGA.md), exercício prático em base fictícia separada e registro de dúvidas/participantes/evidências. Propor revisão ao fim da primeira semana e repetição após correções ou mudança relevante. Usuários das áreas precisam executar os casos na base piloto autorizada; concluir treinamento não aprova automaticamente o piloto.

## Revisão independente e portas de liberação

Preparar para o avaliador externo: versão e hashes, arquitetura, limites do escopo, perfis de teste e duas empresas isoladas, fluxos de autenticação/sessões/Google/SMTP, isolamento de arquivos e empresas, upload/exportação, logs/segredos, quotas/limites, dependências, backup/restauração e configuração HTTPS/host. Combinar autorização, ambiente e regras de teste antes de qualquer avaliação ativa. O relatório deve identificar achados, gravidade, evidências, responsáveis, correções e retestes. Testes internos e auditoria de dependências não são revisão independente; nenhuma foi contratada ou executada por este documento.

A liberação permanece **PENDENTE** até: empresa/dados e pessoas autorizadas; CI da versão final aprovada e pacote/hash/auditoria conferidos; instalação e restauração no destino; 16 cenários aceitos com evidências reais; provedores necessários homologados; treinamento e operação assumidos com substitutos/canais/metas; revisão independente e tratamento dos achados; condições comerciais, privacidade e validações profissionais pertinentes revisadas. Não preencher estes itens com a demonstração nem com o relatório sintético local.
