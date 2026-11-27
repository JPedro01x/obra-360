# Maximizar o espaço de trabalho do Modelador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir maximizar e restaurar o conjunto de ferramentas e viewport usado para editar uma planta 2D/3D.

**Architecture:** `ModelEditor` mantém o estado de maximização e alterna uma classe no espaço de trabalho que contém salvamento, ferramentas de modelagem, opções de visualização, PlanTools, canvas e inspetor. O atalho Esc usa o listener existente; um trap de foco mantém teclado dentro do overlay.

**Tech Stack:** React, TypeScript e CSS existente do Modelador.

**Spec:** `docs/superpowers/specs/2026-11-26-maximizar-modelador-design.md`

## Global Constraints

- Não salvar nem publicar automaticamente por maximizar/restaurar.
- Preservar ferramentas de edição, inspetor e estado do modelo.
- A ação de visualização fica disponível também em modo somente leitura; não altera permissões de edição.
- Verificar por typecheck/build; não adicionar ou executar testes automatizados.

---

### Task 1: Maximizar/restaurar a área do Modelador

**Files:**
- Modify: `src/components/ModelEditor.tsx`
- Modify: `src/components/model-editor.css`
- Modify: `docs/manual/index.html`

- [x] Adicionar estado e botão acessível “Maximizar”/“Restaurar” na barra de opções.
- [x] Envolver barra de salvamento, ferramentas de modelagem, referências, canvases e inspetor numa região com overlay; Esc restaura sem alterar o estado do modelo.
- [x] Conter foco, inativar controles ao fundo, exibir erros/avisos dentro do overlay e limitar rolagem das ferramentas auxiliares para preservar altura útil do canvas.
- [x] Ajustar altura/rolagem da região maximizada e manter o layout normal ao restaurar.
- [x] Atualizar o manual com as ações do botão.
- [x] Executar `npm run typecheck` e `npm run build`.
