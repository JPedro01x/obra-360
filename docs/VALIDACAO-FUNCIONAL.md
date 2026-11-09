# Validação funcional e tema visual

Atualização de aparência: temas Claro, Escuro e Sistema e revisão dos layouts de 320 a 2560 px. A validação atual de aparência e responsividade está em [APARENCIA-RESPONSIVIDADE.md](APARENCIA-RESPONSIVIDADE.md). Os resultados funcionais abaixo documentam a etapa de base anterior.

Revisão de 06/11/2026. Escopo: interface conectada ao banco, API e perfis reais da aplicação. O modo demonstrativo legado não faz parte desta validação. Os testes de escrita usam bases isoladas; não alteram os cadastros da instalação local.

## Alterações visuais

As páginas internas usam a mesma paleta da tela de login: fundo #111113, cartões #19191c, texto claro, bordas grafite e destaque #f97316. Tabelas, formulários, diálogos, RH, documentos privados, portais, conta e modelador usam variáveis de cor comuns. Avisos, erros e sucessos têm cores próprias com contraste no fundo escuro. A planta editável e o fundo 3D acompanham o tema; a folha para impressão mantém fundo claro e sua escala física.

A consulta SEFAZ na interface agora respeita os mesmos perfis autorizados pelo backend: administrador, gerente de obras, almoxarife e financeiro.

O teste ampliado identificou erro interno ao salvar uma importação com o nome de outro modelo da mesma obra. A API agora rejeita a colisão com HTTP 409 e uma mensagem para escolher outro nome; a edição permanece na tela e o histórico anterior não é alterado. A verificação abrange criação, cópia, renomeação e restauração de modelos, mantendo a restrição de unicidade do banco.

## Execuções desta revisão

| Verificação                                                                                              | Resultado                                            |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Backend Java: 66 testes ativos                                                                           | Aprovado, sem falhas                                 |
| Navegador: quinze perfis e suas páginas disponíveis                                                      | Aprovado                                             |
| Matriz: treze cadastros, seis alterações, envio e download de arquivo × quinze perfis = 315 verificações | Aprovado; respostas de sucesso e bloqueio conferidas |
| Backup/restauração e proteção do arquivo de credenciais                                                  | Dois testes aprovados                                |
| Estados da interface, tema, validações, geometria e IFC                                                  | 23 testes aprovados                                  |
| Jornada completa navegador/API/banco                                                                     | Aprovada, incluindo importação e conflito de nomes   |
| PostgreSQL real isolado: 49 cenários e migrações V1–V19                                                  | Aprovado, sem falhas                                 |
| Build final da interface                                                                                 | Aprovado                                             |

O comando `npm run test:roles` concluiu 16 testes: quinze jornadas por perfil e uma matriz com 315 verificações da API. O projeto foi reiniciado na porta 3000 com a versão final; o banco local foi preservado e recebeu backup em `backups/2026-11-06T22-15-39.469Z`.

Os quinze perfis são SUPER_ADMIN, INCORPORADOR, GERENTE_OBRA, ARQUITETO, ENGENHEIRO, FINANCEIRO, RH, MESTRE_OBRA, ALMOXARIFE, AUDITOR, FORNECEDOR, LOCADOR_MAQUINAS, CORRETOR, INVESTIDOR e CLIENTE.

## Cobertura

O teste de perfis abre todos os itens de navegação apresentados a cada conta e todas as seções de RH quando autorizadas. Abre os formulários disponíveis e carrega suas opções, verifica pesquisa e atualização de registros, modos 2D/3D, leitura de IFC, layout de conta em celular, gravação de solicitações de atendimento e logout. Nos portais, envia propostas como fornecedor e locador, reserva unidade como corretor e abre chamado como cliente. Captura erros JavaScript e respostas HTTP inesperadas.

A matriz de gravações verifica criação de obras, fornecedores, contratos, equipes, materiais, ordens, etapas, ocorrências, unidades, cotações, garantias, modelos e estrutura de RH. Verifica também alterações de material, ordem, progresso, ocorrência, disponibilidade de unidade e garantia, além de envio e download de documentos com conferência dos bytes. Cada operação é exercitada pelos quinze perfis: os autorizados devem obter sucesso, os demais devem receber 403. O navegador também baixa o arquivo pelos perfis que têm permissão e confere a ausência desse botão para os demais.

A jornada completa cobre cadastro e edição, movimentação e consumo de estoque, mudança de estados, documentos e downloads, troca/recuperação de senha com SMTP de teste, vínculos externos, RH administrativo, ponto, folha manual, documentos privados, histórico, modelagem e revisões, cópia/arquivo/reativação, desfazer/refazer, exportação e importação JSON, duplicação/exclusão de elementos, edição/exclusão de pavimento vazio, cotas, ambientes, impressão, atendimento, convites e exportação da empresa.

Os testes Java acrescentam isolamento entre empresas, acesso aos dados privados, validação de valores/datas, concorrência de estoque, idempotência, integridade de arquivos, sessões revogadas, MFA, recuperação de senha, limites e convites. Os testes dos adaptadores usam serviços locais controlados para verificar seus contratos.

Abrir e cancelar um formulário confere sua apresentação e carregamento; a gravação é conferida nas demais suítes. Não há prova de todas as combinações possíveis de valores ou de ausência absoluta de defeitos. A validação com funcionários e dados autorizados de uma empresa continua sendo uma etapa separada.

## Reprodução

```powershell
npm test
npm run test:roles
npm run test:integrated
npm run test:postgres
npm run test:backup
node --test scripts/homologacao-credentials.test.mjs
npm run build
```

Backend: `mvn test` dentro de obra360-backend. Os testes de navegador devem ser executados separadamente. O PostgreSQL de teste escolhe uma porta livre em loopback e usa um diretório novo; não reaproveita nem encerra um serviço desconhecido. Capturas e rastros ficam em test-results e os relatórios Java em obra360-backend/target/surefire-reports.

## Limites da confirmação

Google, S3, IA, SEFAZ e e-mail real continuam dependendo de contas e credenciais válidas. Foram testados os estados sem configuração, as permissões e os contratos locais dos adaptadores; não foi comprovada a operação desses provedores em produção. Botões desabilitados por falta de configuração não são apresentados como integrações prontas. A operação comercial, cobrança automática, obrigações jurídicas e piloto do cliente seguem descritos em COMERCIALIZACAO.md.
