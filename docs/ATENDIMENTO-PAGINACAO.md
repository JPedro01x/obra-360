# Atendimento paginado

GET `/api/v1/workspace/atendimento/pagina` retorna `{items,total,page,size}`, em ordem de ID decrescente. `page` começa em zero (padrão 0); `size` aceita 1–100 (padrão 20). Deslocamentos acima de Integer.MAX_VALUE, páginas negativas, tamanhos fora dos limites e filtros desconhecidos retornam 400.

Filtros opcionais: `status=ABERTO|EM_ANALISE|CONCLUIDO` e `categoria=SUPORTE|PRIVACIDADE|EXPORTACAO|EXCLUSAO|CANCELAMENTO`. Ambos são combinados. O tenant vem da sessão; SUPER_ADMIN consulta solicitações da própria empresa, demais perfis somente as próprias. O total usa os mesmos filtros dos itens.

O endpoint legado sem `/pagina` preserva o array e o limite histórico de 200 registros. Consumidores que precisam percorrer todo o histórico devem migrar para a rota paginada.

A interface usa páginas de 20, mostra carregamento, limpa itens antigos enquanto consulta, volta à primeira página ao alterar filtros e aborta requisições substituídas. Uma sequência de requisições impede que respostas atrasadas substituam a consulta atual. Alterações atualizam a consulta e corrigem a página caso o resultado tenha diminuído.

AtendimentoService concentra limite de solicitações pendentes, categorias e situações aceitas, seleção autorizada, bloqueio pessimista, controle de versão e auditoria. O controller valida a entrada HTTP e exige autorização administrativa para responder; o serviço também exige SUPER_ADMIN para responder.

## Evidências e limites

AtendimentoPaginationIntegrationTest cria 205 solicitações próprias e registros de outro usuário/empresa em H2 isolado. Verifica travessia além de 200, filtros, total, compatibilidade, parâmetros limitados e regras extraídas de autorização/versão. A ausência da rota produziu RED (HTTP 500 pelo tratamento global de rota inexistente); a implementação produziu GREEN. A suíte própria de interface verifica paginação, reset de filtro e resposta atrasada com fixtures HTTP.

Paginação por offset representa consultas sucessivas, não um snapshot imutável; inserções concorrentes podem deslocar itens entre páginas. Não há migração nem mudança em RH. A extração de Workspace move apenas tipos, definições estáticas e formatação para components/workspace, preservando os valores e funções.

Revisão: conflito HTTP 409 na resposta administrativa recarrega a página atual e sua versão, preservando a mensagem de conflito. O formulário recebe a resposta mais recente do servidor; rascunhos locais devem ser conferidos antes do novo envio.
