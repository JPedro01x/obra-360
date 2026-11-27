# Progresso — Assistente de configuração da obra

- Backend: V41 criada para dispensas justificadas, com unicidade por empresa/obra/etapa; entidade JPA correspondente.
- API: resumo tenant-scoped baseado em registros correntes de RH, equipes, estoque, cronograma, modelos com elementos e acessos de cliente por unidade.
- Alocação de RH: limita a funcionários ativos da mesma empresa, bloqueia funcionário vinculado a outra obra, valida equipe da obra e registra histórico funcional e auditoria.
- Frontend: cadastro abre o assistente após persistir obra; a lista permite retomar; inclui atribuição de funcionários, dispensa justificada, atalhos para módulos existentes e abertura/criação de modelo real.
- Documentação: cobertura operacional, manual 6.20.2 e catálogo de interfaces atualizados; manual passa a 186 procedimentos.
- Verificação: `npm run typecheck` passou; `npm run build` passou; `mvn -DskipTests compile` não iniciou por `Acesso negado.`; nenhum teste automatizado foi adicionado ou executado.
- Operação: V41 não foi aplicada; API ativa não foi parada nem reiniciada. O recurso ficará disponível na instância depois de uma inicialização autorizada que execute Flyway.
