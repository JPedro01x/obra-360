# Consolidação operacional — 19/11/2026

## Alterações entregues

- Mensageria de criação de OS com outbox transacional, recibo idempotente, novas tentativas limitadas do consumidor e quarentena persistida. Mensagens inválidas não impedem o consumo das próximas. Falha ao gravar a quarentena impede confirmar a recuperação.
- Reenvio de publicações antigas sem recibo, reprocessamento autorizado e auditado, limpeza explícita com simulação e painel de indicadores/falhas por empresa. Quarentena não guarda conteúdo bruto nem texto de exceções.
- Atendimento paginado com filtros, cancelamento de consultas substituídas e recuperação da versão atual após conflito de resposta. Regras de atendimento foram movidas para serviço e definições puras do Workspace foram extraídas.
- Limites opcionais compartilhados de HTTP/IA no banco, com identificadores HMAC, limpeza limitada e recusa de acesso quando o controle compartilhado está indisponível.
- Quota configurável por empresa para novos documentos operacionais/RH, com reserva concorrente, compensação de rollback e autorização do proprietário. Referências UUID são canonicalizadas para impedir aliases em sistemas de arquivos sem distinção entre maiúsculas/minúsculas.
- Exportações com fila persistida, recuperação de reinício, lock de escritor, tentativas limitadas e publicação atômica do ZIP. O worker usa a empresa persistida do pedido e restaura seu contexto ao terminar, inclusive em falhas.
- Overlay Kafka privado para Compose de um host, seleção consistente do overlay no backup e ensaios de CI com/sem mensageria. A inicialização local respeita um broker configurado em outro endereço. Segredo do limitador é independente do JWT.

## Verificações

Os testes utilizaram bases e diretórios isolados. O banco da demonstração não foi usado para carga, migrações de teste ou restauração.

| Verificação | Evidência |
| --- | --- |
| Java, H2, Kafka real e PostgreSQL | 238 testes únicos, zero falhas/erros/ignorados após a etapa PostgreSQL |
| PostgreSQL 18.6 | 91 testes aprovados, incluindo migrações até V34, concorrência, isolamento e transações |
| Interface Chromium | 93 testes aprovados |
| Atendimento e painel de mensageria | 8 testes aprovados com fixtures HTTP; isolamento e escrita efetivos também verificados no backend |
| Jornada navegador/API/banco | 1 jornada completa aprovada |
| Perfis e permissões pelo navegador | 17 cenários únicos aprovados: 14 na execução inicial e três na repetição após corrigir a interpretação do aviso operacional |
| Políticas de entrega e operação | 11 testes aprovados |
| Backup/restauração do script | 1 teste aprovado |
| Dependências | npm sem vulnerabilidades reportadas; OSV sem avisos nos 121 componentes Java identificados do JAR |
| Laboratório HTTPS/PostgreSQL | 34 migrações, login e hashes após restauração física; 64 downloads concluídos sem falha final, com uma retentativa por controle de concorrência |
| Sobrecarga, segurança e integridade | Aprovadas: seis etapas, 3.600 requisições de leitura sem erros, até 200 simultâneas; nove verificações de segurança e cinco de integridade concorrente |

O Maven inicial executou 147 testes e ignorou os 91 condicionados ao PostgreSQL. A execução PostgreSQL executou esses 91 sem ignorados. A soma de 238 não representa duas execuções completas de 238 testes. As auditorias de dependências são uma consulta datada, não certificação de ausência de vulnerabilidades.

Os testes de perfis foram atualizados ao login atual por e-mail/senha. O aviso de mensageria com eventos pendentes e integração desativada é conferido contra o estado efetivo retornado pela API; outros alertas continuam causando falha.

As três falhas iniciais da matriz ocorreram nessa asserção de aviso, nos perfis SUPER_ADMIN, GERENTE_OBRA e AUDITOR. A repetição direcionada passou nos três. Não se apresenta a execução inicial da matriz como integralmente aprovada, nem se contam essas repetições como novos cenários.

## Carga e integridade

O laboratório usou PostgreSQL isolado, 1.001 registros de estoque, heap Java de 768 MiB, pool de dez conexões, 50 threads HTTP e limitador compartilhado ativo. O limite de requisições foi elevado apenas no laboratório para medir processamento, sem confundir respostas esperadas 429 com capacidade de serviço. A máquina possui oito CPUs lógicas e 16 GiB de memória. Foram consultados resumo, estoque, resumo financeiro, detalhes da obra e títulos financeiros.

| Requisições simultâneas | Requisições concluídas | Erros | p95 em ms |
| --- | --- | --- | --- |
| 5 | 150 | 0 | 103,18 |
| 15 | 300 | 0 | 261,36 |
| 30 | 450 | 0 | 472,09 |
| 60 | 600 | 0 | 678,36 |
| 100 | 900 | 0 | 1.067,95 |
| 200 | 1.200 | 0 | 1.292,60 |

Depois da carga, 25 consultas adicionais passaram sem erros, com p95 de 87,09 ms e saldo financeiro preservado. Os testes de escrita concorrente comprovaram: dez saídas aprovadas para dez unidades e 30 conflitos; movimentação idempotente; um recebimento para 12 solicitações repetidas; uma baixa para 30 repetições da mesma chave; e uma atualização aprovada com 29 conflitos para a mesma versão de título. Não se tratou de 3.600 gravações nem de 200 usuários humanos.

As verificações de segurança incluíram autenticação obrigatória, rejeição de JWT adulterado, isolamento de empresa, RBAC, parâmetros inválidos, proteção contra alteração de empresa por mass assignment e cabeçalhos de segurança. Isso não constitui cobertura completa OWASP ou pentest independente.

Evidência: `releases/obra360-2026-11-19T23-24-44-279Z/source/test-results/system-lab-IZ7Hd6/resultado.json`. O SHA-256 do JAR nesse relatório corresponde ao da auditoria de dependências e ao binário do pacote. O ensaio HTTPS está em `test-results/preprod-Fs0vdG/relatorio.json`. Esses caminhos são evidências locais privadas; somente relatórios sem segredos devem ser compartilhados.

## Pacote e repetição

Pacote local: `releases/obra360-2026-11-19T23-24-44-279Z`. O manifesto registra hashes dos arquivos distribuíveis; o relatório de dependências registra o SHA-256 do JAR. O arquivo de fontes contém somente o inventário permitido, sem bancos, chaves, configurações privadas, dependências instaladas ou dados dos laboratórios.

Comandos de repetição: `npm run release:package`, `npm run test:postgres`, `npm test`, `npx playwright test --config playwright.atendimento.config.ts`, `npm run test:integrated`, `npm run test:roles`, `npm run test:delivery-policy`, `npm run test:backup`, `npm run test:stress` e `npm run test:preproduction -- "releases/<id>/bundle"`. As jornadas integrada e de perfis usam as mesmas portas e devem ser sequenciais. Execute carga separadamente de outras suítes para interpretar os tempos.

Logs desta execução ficam em `scratch/consolidacao`; evidências de laboratórios em `test-results` e no snapshot da entrega. Esses diretórios são privados/ignorados pelo Git e não devem ser distribuídos integralmente.

## Limites operacionais e pendências externas

- Armazenamento local exige um escritor por diretório e o mesmo banco/diretório na recuperação. Quotas relacionais não tornam o filesystem distribuído. O ledger não atribui automaticamente arquivos históricos a empresas; essa incorporação depende de inventário validado.
- Kafka do overlay é de um host, sem portas publicadas, com retenção configurada. Não é cluster de alta disponibilidade. Indicadores exigem acompanhamento; não foi contratado/configurado serviço externo de alerta.
- Docker não está disponível nesta máquina. O overlay e o ensaio de restauração lógica em volumes novos foram preparados para o CI, mas sua execução real em Compose precisa ser confirmada no runner/host de destino. O laboratório local executado usa PostgreSQL e HTTPS reais, com restauração física após parada limpa; não equivale ao ensaio Docker.
- Provedores opcionais sem credenciais/homologação continuam desativados. Não foram adicionados armazenamento em nuvem nem autenticação em duas etapas.
- Aceite com uma empresa real, definição de capacidade/SLA no equipamento final, operação dos backups, suporte e revisão das responsabilidades comerciais continuam dependendo dos responsáveis. Testes sintéticos não substituem esse aceite nem uma avaliação independente de segurança.
