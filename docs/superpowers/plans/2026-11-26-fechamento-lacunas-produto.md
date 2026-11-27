# Fechamento das lacunas do Obra360 — plano de implementação

> Plano incremental para implementar e revisar cada fatia de produto antes da seguinte.

**Objetivo:** Fechar as lacunas da interface operacional com persistência SQL tenant-aware, segurança no servidor e situação/documentação claras para dependências externas.

**Arquitetura:** Manter React `Workspace` como interface operacional e Spring Boot como fonte de verdade. Reutilizar endpoints seguros existentes; quando faltarem, incluir migração Flyway, entidade/repositório, serviço, autorização e tela conectada como uma fatia vertical. Manter `App`/`VITE_USE_MOCK=true` apenas como demonstração isolada.

**Tecnologia:** React/TypeScript, Spring Boot, PostgreSQL em produção, H2 isolado local, Flyway, Docker Compose.

**Design:** `docs/superpowers/specs/2026-11-26-fechamento-lacunas-produto-design.md`

## Restrições globais

- Empresa e perfil devem ser obtidos da sessão autenticada no servidor; não confiar nos valores enviados pelo navegador.
- Não aplicar migrações nem reiniciar serviços atualmente em execução sem autorização específica já concedida.
- Não chamar SEFAZ, fornecedores, Google, bancos, SMTP ou IA sem configuração e validação reais.
- Não publicar em produção nem criar host/domínio/segredos ausentes.
- Não registrar dados pessoais, tokens ou segredos nos logs.
- Por instrução do usuário, a autorização de execução é para implementação local; ações externas dependentes de credenciais/aceite ficam pendentes.
- Não adicionar nem executar testes automatizados sem solicitação explícita; compilar e executar verificações não destrutivas permitidas.

## Review Focus

- Identidade/empresa adulterada em request: deve ser ignorada e derivada do principal autenticado.
- Usuário de outra empresa: lista, detalhe, atualização, exportação e download devem negar acesso.
- Repetição de comandos: compras, importações e pagamentos não podem duplicar efeitos.
- Indisponibilidade do provedor: tela deve distinguir “configurado”, “enviado” e “confirmado”.
- Navegação no modo demonstrativo: nenhuma gravação simulada pode ser apresentada como persistida.

## Etapas

### 1. Mapear interface operacional e cobertura de persistência

**Arquivos:** `src/components/Workspace.tsx`, `src/components/OperationForms.tsx`, controladores em `obra360-backend/src/main/java/br/com/obra360/infrastructure/web/controller/`, documentação de auditoria.

- [x] Comparar os 19 recursos tabulares do `Workspace` e os módulos próprios com suas rotas/forms/workflows. O mapa registra também recursos que ainda precisam de revisão de edição, estorno ou remoção.
- [x] Registrar os fluxos especializados, somente leitura, regras de histórico e ausência de conector externo em `docs/COBERTURA-OPERACIONAL.md`.
- [x] Atualizar o mapa sem contar `App.tsx`/mocks como produto operacional; deixar os gaps por módulo explícitos em `docs/COBERTURA-OPERACIONAL.md`.

### 2. Endpoints de chat e marketplace B2B

**Arquivos:** `ChatCorporativoController.java`, `SuprimentosB2BController.java`, seus serviços/entidades e configuração Spring Security.

- [x] Confirmar principal, tenant e autorização usados pelos endpoints atuais. As rotas legadas estavam fora de `/workspace`, recebiam entidades do cliente e eram negadas pela política global; o antigo `SuprimentosB2BController` agora também tem `@PreAuthorize("denyAll()")` explícito.
- [x] Chat: derivar usuário/empresa da sessão, validar participantes do mesmo tenant, filtrar a conversa pelo tenant, limitar histórico e marcar leitura. Adicionada migração `V35`.
- [x] Evitar expor entidades JPA diretamente no chat; usar DTOs de entrada/saída validados.
- [x] Adicionar o chat ao `Workspace` para perfis internos e colaborador.
- [x] Revisar o marketplace B2B. As rotas legadas permanecem indisponíveis pela política de segurança. O portal atual agora lista requisições abertas nas obras vinculadas e grava proposta ligada à requisição, conferindo tenant, acesso do fornecedor, obra e duplicidade no servidor.
- [ ] Conector a ERP/loja externo continua pendente: o fluxo acima persiste proposta no Obra360, mas não envia pedido externo nem confirma venda.

**Verificação da fatia Chat:** `npm run typecheck` e `mvn -q -DskipTests compile` concluíram com código 0. A migração V35 não foi aplicada ao servidor ativo: requer reinício/migração autorizados.

**Verificação do portal B2B:** `npm run typecheck` e `mvn -q -DskipTests compile` concluíram com código 0 após ligar propostas à requisição e limitar os campos visíveis ao fornecedor. Nenhum teste automatizado foi executado e nenhum pedido foi enviado a serviço externo.

**Verificação de listagens e clareza de compras:** `npm run build` e `mvn -q -DskipTests compile` concluíram com código 0 após aplicar projeções por recurso e bloquear explicitamente o controller B2B legado. A tela agora diz “Registrar pedido no Obra360” e avisa que não há transmissão externa.

**Multiempresa de fornecedores:** removida a unicidade global de CNPJ do mapeamento; V37 troca a restrição por `(empresa_id, cnpj)`, o cadastro detecta duplicidade no tenant e as consultas do repositório exigem empresa. Fornecedores legados sem `empresa_id` não são atribuídos por suposição. Migração ainda não aplicada nesta revisão.

**CRUD de cadastros:** Coberturas agora podem ser editadas sem trocar de unidade, com período/categoria validados e auditoria. Fornecedores permitem editar razão social e categoria no tenant atual; o CNPJ não muda. `npm run typecheck`, `npm run build` e `mvn -q -DskipTests compile` concluíram com código 0. V37 foi compilada, mas ainda requer verificação de execução em banco isolado antes da ativação.

**Cronograma:** etapas podem ser corrigidas antes do primeiro avanço/medição; a API bloqueia edição após vínculo ao histórico, rejeita ordens duplicadas e impede regressão do percentual. A interface mostra a ação de edição somente para etapas com 0%. `npm run typecheck` e `npm run build` passaram. A compilação Maven desta sessão não pôde ser repetida: o processo recebeu acesso negado ao arquivo de lock de `C:\Users\sthai\.m2\repository`; isso é uma limitação local de verificação, não uma confirmação de falha ou sucesso do código Java desta alteração.

**Almoxarifado:** exclusão confirmada de material agora verifica tenant, saldo zero e ausência de movimentos, consumo, requisições e itens de pedido. Criação de requisição simples também bloqueia o material; pedido multiproduto adquire locks em ordem determinística, serializando a criação contra exclusão e reduzindo deadlock em lotes com ordem diferente. A interface apresenta exclusão com confirmação de nome para os perfis de estoque. `npm run typecheck`, `npm run build` e `mvn -o -q -DskipTests compile` passaram. Não foi feita validação em runtime/banco nesta fatia.

**Rota legada de cronograma:** `/api/v1/cronograma/**` não aplicava isolamento por empresa; foi explicitamente bloqueada com `denyAll`, pois o Workspace já usa as rotas protegidas tenant-aware. A API antiga não deve ser reativada sem reconstruir autenticação, escopo e validação.

**Cadastro REST legado de empresas:** `/api/v1/empresas/**` serializava entidades e permitiria listar/criar tenants sem o fluxo operacional de provisionamento. Foi bloqueado explicitamente. O provisionamento fica reservado ao operador de plataforma; administradores dos tenants não podem criar ou consultar outras empresas.

**Endpoint REST legado de estoque:** `/api/v1/estoque/**` aceitava `X-Usuario-ID` informado pelo cliente, inclusive com padrão fixo. Foi bloqueado explicitamente; o caminho válido deriva ator/tenant da sessão no Workspace.

**RESTs legados de projeto, contrato, campo, qualidade e documentos:** estes controllers consultavam sem escopo de empresa ou recebiam entidades persistentes completas. Foram bloqueados explicitamente com `denyAll`; as rotas validadas do Workspace são a única interface operacional suportada para esses domínios.

As anotações `denyAll` dos controllers legados, edição do cronograma, remoção segura de material e logs das integrações passaram pela compilação Java offline em 26/11/2026. O frontend também passou em `npm run typecheck` e `npm run build`. A segurança HTTP já possui bloqueio global para rotas fora de `/workspace` e `/portal`; a negação explícita torna a intenção local ao controller também. Não houve teste automatizado nem chamada ao banco/runtime nesta fatia.

**Auditoria de integrações:** chamadas autorizadas de IA e SEFAZ agora registram tentativa, resposta ou falha em `log_auditoria`, com tenant e usuário da sessão e sem persistir texto/pergunta ou chave NF-e. A senha A1 é zerada após inicializar TLS. Timeout e indisponibilidade existentes são mantidos; o provedor não é substituído por resultado fictício. `mvn -o -q -DskipTests compile` passou após as alterações. A validação de credenciais e homologação em provedor real continuam pendentes.

**Idempotência de integrações:** IA/SEFAZ exigem UUID por `X-Idempotency-Key`; restrição única por tenant/usuário/operação/chave bloqueia repetição concorrente. A tabela tem entidade para criação local via Hibernate e migração V38 para PostgreSQL. Só hashes e estados são armazenados por 30 dias. A migração ainda não foi executada em H2/PostgreSQL.

**Verificação da idempotência:** `npm run typecheck`, `npm run build` e `mvn -o -q -DskipTests compile` concluíram com código 0 após o ajuste de entidade e V38. A compilação não executa Flyway. V38 e criação H2 ainda aguardam verificação isolada; o servidor não foi iniciado nem reiniciado.

### 3. Completar módulos operacionais persistentes, um de cada vez

**Arquivos:** componentes de `Workspace`, `OperationForms.tsx`, controladores e serviços existentes; criar migrações Flyway somente quando o modelo não existir.

- [ ] Priorizar os recursos remanescentes com entidade e tabela existentes; chat e proposta do portal B2B têm fluxo persistido no código, e medições têm migração/tela adicionadas, mas ainda aguardam aplicação na instância ativa.
- [ ] Para cada recurso, entregar caminho UI→API→regra de negócio→SQL→leitura atualizada, com paginação, erros e permissões coerentes.
- [x] NF-e agora tem cabeçalho, chave única por empresa, fornecedor, itens, estado e eventos append-only. O registro local e a entrada no estoque são fluxos distintos; autorização SEFAZ não é inferida.
- [x] Medições têm projeto, etapa, autor, quantidades/unidades, anexos PDF/PNG/JPEG com hash e armazenamento privado, estado de aprovação e histórico. A migration V40 ainda depende de execução/autorização no banco.
- [ ] Cada subentrega deve atualizar este plano e a documentação da cobertura.
- [ ] Importação/exportação Excel permanece restrita a funcionários e empreendimentos; os demais módulos ainda não têm modelo/endpoint de planilha.

**Medições — código implementado, migration ainda pendente:** V36 cria registros por obra/etapa/competência, trava duplicidade, conserva eventos, exige aprovação de engenharia antes da liberação financeira e usa o tenant da sessão. A tela operacional lista, cria, aprova e libera registros. O status financeiro não envia pagamentos.

**Evidências das medições — código implementado, migration ainda pendente:** V40 cria metadados de anexos por tenant/medição. A tela permite enviar e baixar PDF, PNG e JPEG; o servidor valida assinatura, MIME e extensão, nome de arquivo sanitizado, tamanho de 20 MB, limite de 20 anexos, isolamento da medição, hash e autorização, e usa armazenamento privado já existente. Não há exclusão ou substituição de anexos, preservando a trilha. As classes Java alteradas compilaram diretamente com JDK 21 e dependências locais. A migration não foi aplicada ao banco ativo; comprovação de upload/download em runtime segue pendente.

**Revisão de operações simuladas:** `src/main.tsx` monta `Workspace` quando `VITE_USE_MOCK=false`; a interface `App.tsx` com serviços e estado local só monta em `VITE_USE_MOCK=true`. `npm run start:demo` define false e serve o Workspace/API/H2 isolados nas portas 3001/8081; `npm run dev:demo` usa `.env.demo` e exibe a faixa de operações fictícias. No Workspace, as rotas operacionais examinadas chamam `requestApi`; os rascunhos do modelador são claramente identificados e só a confirmação do salvamento cria uma revisão no banco.

**Inicializador local:** `scripts/start-demo-isolated.mjs` agora distingue `EADDRINUSE` de outras falhas ao sondar portas, sem iniciar processos antes de concluir o preflight. `node --check scripts/start-demo-isolated.mjs` concluiu com código 0. A validação HTTP local permaneceu indisponível pelas permissões de rede desta execução.

**Projeções de listagem — código compilado:** `GET /api/v1/workspace/registros/{resource}` agora envia apenas campos da tabela/ações por módulo. A lista de usuários omite metadados de autenticação; a lista de documentos omite o local interno e o hash do arquivo. A tela continua recebendo o ID e os campos necessários para suas ações. A mudança reduz os dados retornados por listagem, mas ainda não foi medida em execução.

**NF-e — código compilado:** a tela de demonstração só exibe exemplos rotulados e não oferece botão que invente conciliação. O Workspace tem cadastro manual paginado, detalhes de itens/eventos, cancelamento justificado enquanto pendente e entrada de estoque com atualização de custo médio, logs e operação transacional protegida por empresa. Os documentos não têm exclusão física; chave duplicada na mesma empresa e entrada repetida são recusadas. `npm run typecheck`, `npm run build` e `mvn -o -q -DskipTests compile` passaram após essas alterações. V39 ainda não foi aplicada; execução da migration, fluxo H2 e operação concorrente continuam sem validação em banco/runtime. Não há importação XML nem autorização SEFAZ neste fluxo.

### 4. Integrações externas e interoperabilidade

**Arquivos:** `IntegrationsController.java`, serviços/adapters e documentação `INTEGRACOES.md`.

- [x] IA e SEFAZ usam HTTPS obrigatório (HTTP apenas em loopback), redirects desligados, timeout de conexão/resposta, corpo limitado a 2 MB, autorização/consentimento e falha explícita. IA/SEFAZ agora também geram eventos de tentativa/resultado sem gravar prompt ou chave fiscal.
- [x] IA e SEFAZ exigem `X-Idempotency-Key`; V38 persiste hashes e estado por usuário/tenant, rejeita repetição/reuso com outro payload e expira registros após 30 dias, sem guardar prompt/resposta/chave fiscal.
- [ ] Aplicar V38 e conferir o contrato em banco isolado antes de ativar chamadas em uma instalação atualizada.
- [ ] Manter adaptadores desligados enquanto faltarem endpoint, credencial, sandbox e confirmação do responsável.
- [ ] Para consulta fiscal, executar homologação com certificado e ambiente autorizado; não interpretar apenas validação local como consulta SEFAZ.
- [ ] Para pedido de material externo, enviar somente após aprovação explícita e registrar protocolo/erro real do fornecedor.

### 5. IFC e assistência de IA

**Arquivos:** `IfcParserService.ts`, visualizador/worker IFC, `CopilotAiDrawer.tsx`, integrações e documentação.

- [x] O Workspace operacional usa `RealIfcParser` em worker; o parser mock do App demonstrativo lança erro fora de `VITE_USE_MOCK=true`. Limites declarados: 20 MB, 10 mil elementos, quantidades declaradas/unidades conhecidas; sem cálculo geométrico inventado.
- [x] A tela operacional não exibe métricas simuladas de IFC; ausência de quantidade fica como “Não informado”, e falha de leitura aparece como erro.
- [x] A IA envia somente a pergunta com consentimento explícito da tela e validação `@AssertTrue` no servidor; respostas externas com falha retornam indisponibilidade, sem fallback inventado. Tentativa/resultado entram em auditoria sem conteúdo.
- [ ] Rodar homologação visual/quantitativa com arquivos IFC autorizados e de origem controlada antes do aceite de uso profissional.

### 6. Preparar liberação do piloto sem ativação prematura

**Arquivos:** `deploy/`, scripts de release/backup, `docs/OPERACAO-PRODUCAO.md`, `docs/ENTREGA-PILOTO.md`.

- [x] Executar build e preflight local não destrutivos. `npm run build` passou; `npm run verificar:producao` retornou 1 (`configuracaoApta:false`), com apenas o requisito de JWT em OK.
- [ ] Revisar imagens/segredos do pacote de release.
- [ ] Documentar uma lista curta e concreta de itens externos pendentes: host, domínio, certificados, segredos, SMTP, operador, backup restaurado e aceite do piloto.
- [ ] Marcar release como pronto apenas depois da evidência no ambiente real; deploy depende de destino e credenciais aprovados.

## Critério de saída

O produto operacional não deve oferecer ações que só atualizem mocks. Cada lacuna fica implementada com persistência segura ou aparece como indisponível/pendente, com documentação atualizada. Não declarar produção concluída sem provisionamento, restauração e aceite do ambiente real.
