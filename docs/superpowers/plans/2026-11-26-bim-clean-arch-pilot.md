# BIM Real, Clean Architecture e Piloto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importar e persistir geometria IFC real no modelador, provar uma fronteira Clean Architecture em um fluxo vertical e gerar evidência reproduzível para um piloto de instância única.

**Architecture:** A malha IFC será extraída no worker, validada e armazenada no documento versionado de modelo; o mesmo documento alimenta projeção 2D e renderização 3D. Um caso de uso estabelecerá portas independentes de framework e adaptadores de infraestrutura, enquanto uma regra automatizada impede dependências invertidas na nova feature e documenta os módulos legados. Um comando de prontidão executará verificações existentes e reunirá resultados e hashes sem publicar segredos.

**Tech Stack:** React, TypeScript, Three.js, web-ifc, Node.js, Java 21, Spring Boot, JPA, PostgreSQL, Flyway, Docker Compose, Playwright/JUnit.

**Spec:** `docs/superpowers/specs/2026-11-26-bim-clean-arch-pilot-design.md`

## Global Constraints

- Preservar compatibilidade de documentos de modelo já persistidos.
- Respeitar o isolamento por empresa e a autorização de cada rota.
- Manter o modelador inicial leve; carregar parsing/modelagem pesada sob demanda.
- Limitar tamanho de arquivo, número de elementos e geometria processada; rejeitar entrada excedente com mensagem clara.
- Não gravar segredos ou dados reais de cliente em relatórios, testes ou Git.
- Não declarar publicação, aceite de cliente ou integração externa sem evidência do ambiente correspondente.

## Review Focus

- IFC inválido, sem geometria ou com geometria acima do limite deve falhar sem alterar o modelo.
- Arquivos IFC com múltiplas geometrias por entidade devem preservar índices, transformações, orientação e escala.
- Documentos de modelos antigos sem campo de malha devem continuar sendo abertos e salvos.
- Tentativas de acessar outro tenant pelo novo caso de uso devem falhar.
- Validação interrompida, comando indisponível ou pendência humana deve produzir relatório incompleto/falha, nunca “pronto para produção”.

---

### Task 1: Importação de geometria IFC para o modelador corporativo

**Files:** `src/services/RealIfcParser.ts`, `src/services/IfcWorker.ts`, `src/components/IntegrationHub.tsx`, `src/services/modelGeometry.ts`, `src/components/ModelEditor.tsx`, `src/components/ModelPlan.tsx`, `src/components/ModelViewport.tsx`, `obra360-backend/src/main/java/br/com/obra360/application/service/ModeloDocumento.java`, `ModeloDocumentoService.java`, tests e fixture IFC.

- [ ] Adicionar primeiro testes da conversão IFC → documento e limites de geometria; confirmar falha antes do código.
- [ ] Estender o worker com um modo de leitura quantitativa existente e outro de importação geométrica; o chamador deve impor timeout e encerrar o worker.
- [ ] Confirmar com fixture e teste que o fator linear do web-ifc é aplicado uma única vez; preservar transformações, origem e orientação dos eixos.
- [ ] Converter elementos com GUID, categoria, nome e malha preservados; impor limites tanto no número de elementos como no total serializado antes de liberar o modelo para salvamento.
- [ ] Renderizar a malha real na vista 3D e sua projeção superior na planta; manter seleção, movimentação, rascunho e versionamento atuais.
- [ ] Validar os novos campos no frontend e backend, mantendo documentos antigos válidos.
- [ ] Testar importação de fixture, arquivo inválido, excesso de elementos, salvamento/reabertura e edição 2D/3D.

### Task 2: Fronteira Clean Architecture verificável

**Files:** novos pacotes `application/usecase`, `application/port/out`, `domain/model`, `infrastructure/persistence/adapter`, controller de catálogo de obras e teste de fronteira por imports.

- [ ] Selecionar o catálogo de obras por empresa, mantendo a rota genérica usada pelas telas sem abrir as rotas antigas `denyAll`.
- [ ] Criar teste que descreva a dependência permitida e confirme falha ao adicionar import proibido nos pacotes delimitados.
- [ ] Definir um `ObraResumo` puro, porta de leitura no application e caso de uso; implementar adaptador JPA em infrastructure sem expor entidade JPA.
- [ ] Refatorar o endpoint do workspace para transportar DTO e invocar o caso de uso, preservando tenant, autorização, paginação e formato atual.
- [ ] Adicionar verificação de imports para os namespaces novos e o controller refatorado; listar explicitamente os pacotes legados que ainda não atendem à regra global.
- [ ] Executar testes do caso e regressões de isolamento/permissão.

### Task 3: Pacote verificável de validação e implantação do piloto

**Files:** `scripts/`, `package.json`, `docs/ENTREGA-PILOTO.md`, `docs/OPERACAO-PRODUCAO.md`, `docs/OBSERVABILIDADE.md` e novo relatório técnico de validação.

- [ ] Escrever primeiro testes do agregador de validação, cobrindo sucesso, falha e comando ausente.
- [ ] Implementar um comando que execute verificações nomeadas, interrompa aprovação em falha e grave hash de árvore-fonte, commit quando Git estiver presente, estado dos serviços, Docker Compose e dos requisitos operacionais.
- [ ] Alinhar a evidência ao modo de implantação: produção atual constrói a imagem pelo Compose; o pacote `release:package` é artefato alternativo e não pode ser usado como prova dessa imagem.
- [ ] Descrever claramente as etapas manuais de configuração privada, implantação, teste de restauração e aceite, sem copiar segredos.
- [ ] Atualizar status e versões do relatório para o pacote realmente compilado; separar relatórios históricos.
- [ ] Verificar Compose, saúde, perfis de banco e instruções de rollback com configurações de exemplo, sem publicar.

### Task 4: Revisão integrada e relatório final

- [ ] Rodar validações do frontend, Java/H2, PostgreSQL, jornadas de modelo e verificações do pacote.
- [ ] Revisar alterações de segurança, tamanho de payload, compatibilidade, tenant e evidências.
- [ ] Atualizar o relatório técnico e indicar os requisitos de ambiente real que continuam pendentes.
