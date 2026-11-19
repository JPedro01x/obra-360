# Consolidação operacional Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans within each independent workstream. Integration and final review belong to the primary agent.

**Goal:** Consolidar mensageria, atendimento, limites e exportações sem perder dados ou alterar permissões existentes.

**Architecture:** Preservar o monólito Spring Boot, o frontend conectado e o armazenamento local. Usar persistência relacional para controles compartilhados e falhas; manter compatibilidade das rotas existentes. A operação de arquivos continua limitada a um escritor por diretório até homologação específica de armazenamento compartilhado.

**Tech Stack:** Java 21, Spring Boot, JPA/H2/PostgreSQL, Kafka, React/TypeScript, Playwright.

**Spec:** Pedido de implementação das pendências revisadas na conversa em 19/11/2026.

## Global Constraints

- Preservar dados existentes e mudanças locais anteriores de mensageria.
- Não habilitar provedores externos nem obrigações legais sem credenciais e homologação.
- Não adicionar armazenamento em nuvem ou autenticação em duas etapas.
- Validar empresa/perfil no servidor; não confiar em IDs de empresa enviados por consumidores.
- Testes usam bases e arquivos isolados; não executar carga na base da demonstração.
- Não publicar nem substituir instalação ativa durante o trabalho.

## Review Focus

- Mensagem inválida não pode bloquear indefinidamente uma partição nem perder evidência da falha.
- Falha no banco durante quarentena não pode confirmar o consumo.
- Reprocessamento e paginação não podem expor dados de outra empresa.
- Reinício não pode perder trabalhos enfileirados nem duplicar processamento.
- Concorrência não pode ultrapassar limites de uso ou expor segredos nos registros.

## Workstreams

- [ ] **Mensageria (primary):** teste vermelho para mensagem inválida seguida de válida; quarentena durável e idempotente, tentativas limitadas, reprocessamento autorizado, retenção simulada e indicadores. Migração reservada V31. Validar broker real e isolamento.
- [ ] **Atendimento/frontend:** serviço para regras de atendimento, paginação compatível e filtros; frontend paginado com proteção a respostas atrasadas; extrair definições puras do Workspace. Sem migração.
- [ ] **Limites:** controles relacionais compartilhados de requisições/IA e limites configuráveis por empresa no armazenamento privado; manter APIs compatíveis, documentar limites de operação. Migrações reservadas V32–V33. Provar concorrência e isolamento.
- [ ] **Exportação:** fila durável e recuperação segura após reinício, mantendo autenticação, quota global e limites. Migração reservada V34 se necessária. Não alterar DocumentStorage sem coordenação.
- [ ] **Entrega (primary):** overlay Kafka interno para Compose, verificações de configuração e documentação; controles de falhas não são comprovação de produção distribuída.
- [x] **Integração:** executar testes Java, TypeScript, build, testes de políticas, PostgreSQL e jornadas reais pertinentes. Atualizar evidências com limitações verificadas.
- [x] **Revisão final:** revisar diff e resultados, registrar itens dependentes de infraestrutura e aceite humano. Preparar versão revisável sem simular homologação externa.

## Decisions

- A paginação preservará o endpoint legado por compatibilidade, com uma rota paginada explícita para a interface.
- O banco de dados da aplicação será a fonte dos controles compartilhados; não introduzir Redis ou outro serviço obrigatório.
- Quarentena guarda identificadores e hash do conteúdo, não a mensagem bruta ou texto de exceção potencialmente sensível.

## Evidence

Resultados e limitações registrados em docs/VALIDACAO-OPERACIONAL-2026-11-19.md. Revisão cruzada encontrou e corrigiu contexto de exportação, alias UUID, atualização após conflito e autostart de broker configurado. Java: 238 cenários únicos aprovados após complementar PostgreSQL. Interface: 93 + 8; jornada: 1; perfis: 17 após repetição direcionada de três testes. Carga: 3.600 leituras, até 200 simultâneas, sem erros no laboratório; não equivale a aceite de produção. Docker/Compose não executado nesta máquina, sem Docker disponível.
