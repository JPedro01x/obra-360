# Evidências da preparação local — 20/11/2026

## Escopo autorizado

O responsável informou que ainda não há empresa real, participantes do piloto ou contas de provedores e escolheu preparar tudo localmente. Esta entrega prepara e testa os componentes técnicos; não registra aceite de uma empresa, contratação de serviços, homologação com provedores reais ou auditoria independente externa. A base da demonstração foi preservada.

## Entregáveis

- `PREPARACAO-LOCAL-2026-11-20.md`: 16 cenários de piloto pendentes, evidências exigidas, matriz de responsabilidades por papel, rotina proposta de operação, backup, incidentes e critérios de homologação de Google, e-mail, IA e SEFAZ.
- `REVISAO-SEGURANCA-LOCAL-2026-11-20.md`: revisão interna com cobertura e limites; correções de proteção do login e de recebimento das respostas externas.
- `piloto-operacional-2026-11-20.local/`: cópias privadas dos formulários de implantação e aceite, instruções e resumo da validação técnica. A pasta é ignorada pelo Git. O formulário vazio continua reprovando a liberação, com código 1; nenhuma aprovação foi preenchida automaticamente.
- Pacote candidato `releases/obra360-2026-11-20T11-59-40-901Z`, com manifesto e auditoria vinculada ao SHA-256 do JAR `6a2d51ede47633d455fab5bebba14513968bf472e5a43a919cb3289722120ec0`. Configurações privadas, bancos e credenciais não integram os arquivos distribuíveis.

## Correções e diagnóstico

1. O CI anterior falhou inicialmente ao resolver o parent Spring Boot. A repetição com cache Maven vazio resolveu a mesma versão 4.1.2, e o Docker também compilou sem trocar a versão. A falha de resolução não permaneceu reproduzível.
2. O ensaio Docker seguinte expôs colisão entre o endereço automático da aplicação e o endereço fixo do proxy. A aplicação recebeu `172.30.86.3`; o proxy continua em `172.30.86.2`, preservando a configuração restrita de proxy confiável. Os ensaios com e sem Kafka são independentes no CI.
3. Duas fixtures financeiras usavam a data UTC do runner enquanto a regra correta usava São Paulo. As fixtures agora usam explicitamente São Paulo, com regressões determinísticas às 00:04 UTC e às 03:00 UTC. A regra de negócio não foi relaxada.
4. Um login válido em outra conta podia apagar as falhas do IP. O login passou a manter tentativas por conta no banco, com atualização transacional e bloqueio de linha: cinco falhas bloqueiam novas autenticações por senha por quinze minutos. Sucesso limpa somente a conta autenticada; tentativas durante o bloqueio não prorrogam o prazo. A resposta continua genérica. A proteção por IP permanece adicional.
5. IA e SEFAZ verificavam tamanho depois de materializar a resposta. O handler compartilhado passou a limitar efetivamente o corpo a 2.000.000 bytes antes de copiar a entrega excedente, cancelando o recebimento e preservando erros genéricos e redirecionamentos desabilitados.

Uma revisão cruzada posterior do diff não apontou novos achados críticos, P1 ou P2. Foram anotadas lacunas menores de cobertura para corrida entre login correto/incorreto e resposta HTTP lenta. Essa revisão também é interna e não equivale a pentest externo.

## Resultados locais

| Verificação | Resultado observado |
| --- | --- |
| Java completo, incluindo Kafka real | 158 testes executados sem falhas; 96 condicionados ao PostgreSQL foram executados separadamente |
| PostgreSQL 18.6 | 96 testes aprovados, incluindo cinco cenários de proteção do login com concorrência real |
| Total Java único consolidado | 254, zero falhas, erros ou ignorados após a etapa complementar |
| Auditoria do JAR | 121 componentes identificados, inventário completo e nenhum aviso reportado pelo OSV na consulta datada |
| Frontend e npm | Build aprovado e nenhum aviso reportado pelo npm audit |
| Políticas de entrega/operação | 11 testes aprovados |
| Script de backup | Um teste aprovado |
| Laboratório PostgreSQL/HTTPS do pacote | 34 migrações, provisionamento, login e hashes após restauração física aprovados |
| Transferências após restauração | 64 concluídas, duas retentativas por 503 de controle de concorrência, zero falha final |
| Aceite vazio | Rejeitado como pendente, sem simular responsáveis ou assinaturas |

A JVM da validação Java/PostgreSQL foi executada em UTC. A recuperação física medida no laboratório levou 26.857 ms; esse tempo não é RTO contratado nem previsão para outro equipamento. Os ensaios usam dados sintéticos em bases isoladas. As integrações locais usam servidores de teste, assinaturas de teste e parsing XML seguro; não representam autenticação ou entrega com provedores reais.

Logs locais: `scratch/piloto-local/release.log`, `postgres.log`, `preproduction.log`, `policy.log`, `backup.log` e `aceite-pendente.log`. Evidência de restauração: `test-results/preprod-OaEk9u/relatorio.json`. Os laboratórios e o dossiê são privados e não devem ser publicados integralmente.

## CI e instalação em contêiner

Correções enviadas à `main` no commit `ee9e72ae74d638d29fccc0278a148be796f4dd63`. Execução: [GitHub Actions 44733271932](https://github.com/JPedro01x/obra-360/actions/runs/44733271932).

**Execução concluída com sucesso no commit indicado: todos os quatro jobs foram aprovados.** Os jobs Docker com e sem Kafka aprovaram construção da imagem, inicialização, HTTPS, gravação de documento, backup lógico, restauração em volumes novos e conferência do documento via HTTPS. O backend foi aprovado. O job frontend confirmou 93 cenários de interface, oito de atendimento/mensageria, uma jornada integrada, 17 cenários de perfis/permissões e 96 testes PostgreSQL, todos aprovados: 119 cenários únicos de navegador. O ambiente desse job usa UTC e as fixtures financeiras corrigidas.

Docker não foi instalado no computador do responsável. O resultado do runner Linux comprova o ensaio de contêiner nessa configuração, não a instalação em um host definitivo ainda não disponibilizado.

## Itens externos que continuam pendentes

Empresa e dados autorizados; usuários responsáveis e substitutos; execução e aceite dos 16 casos pelos participantes; contas e credenciais dos provedores escolhidos; homologação real de Google/SMTP/IA/SEFAZ; destino definitivo e suas permissões, continuidade e capacidade; canais e metas de operação assumidos por pessoas reais; avaliação independente externa e tratamento dos achados. Até isso ocorrer, esses itens permanecem pendentes e os provedores sem configuração continuam desativados.
