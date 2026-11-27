# Assistente de configuração inicial da obra — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Depois de criar a obra, guiar o usuário para vincular pessoas, equipe, materiais, cronograma, planta 2D e cliente com dados persistidos e validação da empresa.

**Architecture:** A API cria primeiro `ProjetoObraEntity`; cada etapa grava por endpoint próprio e pode ser retomada. Uma API de configuração resume o estado derivado dos módulos e persiste somente dispensas justificadas. A interface React mantém o wizard aberto para cada `projetoObraId` e não repete a lógica de CRUD dos módulos quando já existe endpoint adequado.

**Tech Stack:** React, TypeScript, `requestApi`, Spring Boot, JPA, PostgreSQL/H2, Flyway.

**Spec:** `docs/superpowers/specs/2026-11-26-assistente-configuracao-obra-design.md`

## Global Constraints

- Derivar empresa e ator da sessão; validar cada ID no tenant e na obra atual.
- Não mover automaticamente funcionário já alocado a outra obra; retornar conflito para resolução pelo RH.
- Atribuições de funcionários devem gerar histórico funcional e auditoria sem expor dados pessoais desnecessários.
- Criar item de estoque começa com saldo zero; recebimento só por movimentação explícita.
- Cliente só recebe acesso externo explícito por unidade; só perfis autorizados podem conceder esse acesso.
- A planta só conta como concluída quando houver revisão persistida com elementos; rascunho local/modelo vazio continua pendente.
- Não gerar dados fictícios ou etapas, materiais, clientes e quantidades pré-preenchidos.
- Não aplicar migrations nem reiniciar a API que o usuário pediu para manter ativa.
- Não adicionar nem executar testes automatizados; validar compilação e verificações estáticas não destrutivas.

## Review Focus

- IDs de funcionário, equipe, material, unidade ou modelo de outra empresa/obra devem ser recusados.
- Funcionário ativo já alocado a outra obra não deve ser transferido silenciosamente.
- Falha em uma etapa não deve apagar a obra nem vínculos já persistidos em outras etapas.
- Usuário sem permissão não deve receber a ação ou formulário da etapa correspondente.
- Um projeto com dados ainda faltantes deve permanecer retomável e mostrar status pendente, sem ser apresentado como configurado.

---

### Task 1: API de configuração e alocação de responsáveis

**Files:**
- Create: `obra360-backend/src/main/java/br/com/obra360/domain/entity/ProjetoConfiguracaoEtapaEntity.java`
- Create: `obra360-backend/src/main/java/br/com/obra360/infrastructure/web/controller/ProjetoConfiguracaoController.java`
- Create: `obra360-backend/src/main/resources/db/migration/V41__projeto_configuracao_etapas.sql`
- Modify: `obra360-backend/src/main/java/br/com/obra360/application/service/RhHistoricoService.java` only if a narrow reusable allocation method is needed.

**Interfaces:**
- `GET /api/v1/workspace/projetos/{id}/configuracao` returns step keys `responsaveis`, `equipe`, `materiais`, `cronograma`, `planta2d`, `cliente`, each with `status`, `quantidade` and `motivoDispensa` where applicable.
- `PUT /api/v1/workspace/projetos/{id}/responsaveis` accepts `{ equipeId, funcionarios: [{ funcionarioId, equipeId }], motivo }`; updates only project/team assignment fields for active employees from the tenant, validates each team belongs to the project, writes RH history and audit, and rejects assignment to a different existing project.
- `PUT /api/v1/workspace/projetos/{id}/configuracao/{etapa}/dispensa` accepts `{ justificativa }` for a supported step and records the user and timestamp. A repeated request updates the same project/step record.
- Completion for team, employees, materials, stages, client access and models is calculated from their real domain records; a blank/new model does not count as a saved plan.

- [x] Add the V41 table with a tenant/project/step uniqueness rule, bounded reason, actor and timestamp; map it as a JPA entity.
- [x] Implement the tenant-scoped configuration summary, deriving completed/pending states from current records and including stored justified dispensations.
- [x] Implement responsible-person allocation with active-employee, tenant, existing-allocation, team/project, RH-history and audit validation.
- [x] Implement justified step-dispend handling with an allowlist of supported step keys and create-permission checks.
- [x] Inspect the final controller and migration for tenant leaks, excessive returned RH fields and invalid/missing-resource behavior.

### Task 2: Wizard UI connected to persistent module flows

**Files:**
- Create: `src/components/ProjectSetupWizard.tsx`
- Modify: `src/components/Workspace.tsx`
- Modify: `src/components/workspace.css`

**Interfaces:**
- `ProjectForm.onSaved(projectId: number)` receives the ID returned by `POST /v1/workspace/projetos`.
- `ProjectSetupWizard` receives `{ projectId, role, onClose, onOpenModeler, onChanged }` and loads its status from `GET /v1/workspace/projetos/{id}/configuracao`.
- Team creation uses `POST /v1/workspace/equipes`; material creation uses `POST /v1/workspace/estoque` (zero initial balance); schedule stages use the existing `/v1/workspace/cronograma` flow; model creation uses `/v1/workspace/modelador/modelos`; customer access uses the existing unit and external-access flows.

- [x] Change the project form callback to return the saved project ID and open the setup wizard after base-project creation.
- [x] Build a desktop-friendly step list for responsible staff/team, materials, schedule, 2D plan and client, showing `Pendente`, `Concluída` or `Não se aplica` from the API response.
- [x] Add step forms that call existing create flows or the dedicated responsible/configuration endpoints; show server errors beside the active step and preserve unsent values on failure.
- [x] Hide steps/actions the current profile cannot execute; explain when a step must be completed by another authorized role without exposing inaccessible controls.
- [x] Add pause/close and resume behavior from the project listing/details, reloading status from SQL rather than browser-only state.
- [x] For 2D, create/select a real project model and open the Modelador; refresh the step state after the user saves a revision.
- [x] For client access, require an existing `CLIENTE` account and a unit in that project; allow unit creation only through its authorized flow.

### Task 3: Documentation and local compile verification

**Files:**
- Modify: `docs/COBERTURA-OPERACIONAL.md`
- Modify: `docs/manual/index.html`
- Modify: `docs/INTERFACES-E-MANUAL.md` if its procedure count or project-creation index needs updating.

- [x] Document the staged project setup, permission prerequisites, resumable pending states, explicit unit-scoped client access and zero-stock rule.
- [x] Add the user-manual procedure for creating a project and resuming its configuration, updating its visible procedure count.
- [x] Run `npm run typecheck` and `npm run build`; both exit code 0.
- [x] Run `mvn -DskipTests compile` from `obra360-backend`; command blocked before compilation with `Acesso negado.`.
- [x] No scripts were changed, so `node --check` was not applicable.
- [x] Report that V41 is code-only until applied at an authorized API restart; do not claim the running instance has the new wizard.

## Plan self-review

- All requested parts map to a wizard step or the base project fields.
- Each relation is tenant-scoped; client access remains unit-scoped; HR allocations retain their existing functional history.
- Materials are cataloged without inventing received stock; a model stays pending until its drawing revision is saved.
- The project remains usable while setup is incomplete; successful steps survive failures in later steps.
- Validation commands avoid automated test execution per the active instruction.
