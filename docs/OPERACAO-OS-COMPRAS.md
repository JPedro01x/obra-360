# Regras de OS, contratos e compras

Este registro descreve a etapa de OS e compras. As entregas posteriores de qualidade, garantia, notificações e preparação do piloto estão em [MELHORIAS-E-VALIDACAO.md](MELHORIAS-E-VALIDACAO.md) e [ENTREGA-PILOTO.md](ENTREGA-PILOTO.md).

Implementação de 11/11/2026. Complementa a revisão documental anterior, que descreve o commit 639d4fc e não inclui estas alterações.

## Contratos e abertura de OS

- O contrato precisa estar ativo e a data atual deve estar dentro da vigência, incluindo as datas inicial e final.
- A inativação impede novas OS. Ordens já abertas podem continuar a ser executadas e encerradas.
- O campo Ativo e a ação de ativar/inativar ficam em Contratos.
- Se o prazo manual da OS ficar vazio, o backend calcula o prazo em horas corridas: BAIXA usa duas vezes o SLA contratual; MEDIA usa o SLA; ALTA usa metade; URGENTE usa um quarto. O mínimo é uma hora. Não há calendário de feriados ou expediente.
- O prazo manual continua disponível para os perfis que já criavam OS. Ele deve ser futuro.
- A criação permite marcar Exigir consumo de material. Nas ordens antigas o padrão é não exigir, preservando seu comportamento.

## Encerramento

Ordens em andamento, dentro do prazo, podem ser concluídas pela ação Atualizar ordem. Quando o consumo é obrigatório, deve existir um consumo registrado para a OS.

Para uma ordem atrasada:

1. Um usuário autorizado registra uma justificativa entre 10 e 2000 caracteres.
2. Outro usuário usa Aprovar e concluir OS atrasada. A aprovação cabe ao responsável cadastrado da obra (ENGENHEIRO ou GERENTE_OBRA) ou a SUPER_ADMIN. A substituição pelo administrador é uma política desta implementação e deve ser conciliada com o escopo acadêmico.
3. O backend verifica a separação entre solicitante e aprovador e o consumo obrigatório e registra o encerramento e os responsáveis.

A transição comum de status não contorna a aprovação. Cancelamento é uma operação distinta de conclusão. A justificativa, o solicitante e o aprovador ficam persistidos, e as operações geram auditoria.

## Compras

O menu Estoque e compras inclui Requisições e pedidos. Esta versão trabalha com **um material por requisição e recebimento integral**. Não inclui recebimentos parciais, múltiplos materiais em um mesmo pedido, integração fiscal, devolução ou contas a pagar.

Fluxo:

1. Criar a requisição com material, quantidade e justificativa.
2. Registrar propostas de fornecedores da empresa. O valor representa o total da quantidade solicitada, na unidade cadastrada para o material.
3. Comparar as propostas, exibidas por valor total com fornecedor e prazo, e selecionar uma.
4. Aprovar pela gestão e pelo financeiro, com duas pessoas distintas.
5. Emitir o pedido.
6. Confirmar o recebimento integral após a conferência física. A confirmação atualiza o saldo, registra a entrada e recalcula o custo médio.

Estados: COTACAO → APROVACAO → APROVADO → PEDIDO → RECEBIDO. É possível cancelar antes de receber. Propostas ficam bloqueadas após a seleção. O sistema permite selecionar uma proposta mesmo quando há somente um fornecedor; não foi criada uma obrigação de três cotações.

Perfis:

| Operação | Perfis |
| --- | --- |
| Requisitar, cotar, selecionar, emitir e cancelar | SUPER_ADMIN, GERENTE_OBRA, FINANCEIRO, INCORPORADOR |
| Aprovar pela gestão | SUPER_ADMIN, GERENTE_OBRA, INCORPORADOR |
| Aprovar pelo financeiro | SUPER_ADMIN, FINANCEIRO |
| Receber | SUPER_ADMIN, GERENTE_OBRA, ALMOXARIFE |
| Consultar requisições | Perfis comerciais acima, ALMOXARIFE e AUDITOR |

Um mesmo SUPER_ADMIN não pode preencher as duas aprovações. A aprovação não exige uma terceira pessoa distinta do requisitante. Os registros são isolados por empresa e as mudanças usam bloqueio transacional.

O recebimento repetido de um pedido já recebido retorna o registro existente e não repete a entrada. O custo médio é `(saldo anterior × custo médio anterior + valor total da proposta) / novo saldo`, arredondado a duas casas. Frete e tributos separados não são calculados: devem ser considerados no valor informado quando aplicável.

## Persistência e atualização

V24 acrescenta estado de contrato e controles de encerramento. V25 cria requisições e vincula propostas. Não há exclusão ou substituição dos cadastros existentes. PostgreSQL usa Flyway; o perfil local usa atualização de schema pelo Hibernate, com valores padrão para os novos indicadores.

As requisições também integram a exportação privada da empresa. Essa exportação continua distinta de backup restaurável.

## Validação

Os testes de integração incluem vigência, prazo automático, exigência de material, aprovação de encerramento por outro usuário, isolamento empresarial, permissões de compra, bloqueio de etapas, dupla aprovação, congelamento das propostas, recebimento repetido e custo médio.

A jornada de navegador integrada cadastra usuários, executa OS, registra uma compra, aprova com gestão/financeiro, recebe e confere o saldo e custo. Os testes utilizam bases isoladas. Os resultados efetivamente executados devem ser consultados no relatório desta entrega.

### Resultados de 11/11/2026

| Verificação | Resultado |
| --- | --- |
| Build do frontend (TypeScript e Vite) | Aprovado |
| Suíte Java com H2 e demais testes | 73 executados sem falhas; 56 casos PostgreSQL ignorados nessa execução condicional |
| Suíte específica PostgreSQL | 56 executados sem falhas, incluindo as regras de OS e compras; 25 migrações aplicadas |
| Interface Chromium | 50 cenários aprovados |
| Jornada integrada sem mocks HTTP | 1 jornada aprovada, incluindo compra, dois usuários aprovadores e conferência do estoque |

Logs locais: test-results/operacao-backend.log, test-results/operacao-postgres.log e test-results/operacao-integrated.log. Os testes PostgreSQL incluem a verificação adicional de que outro engenheiro da empresa, sem responsabilidade pela obra, não pode aprovar o encerramento. Esses resultados não representam aceite operacional de uma empresa nem validação de provedores externos.

## Demais pendências

Esta implementação cobre a primeira etapa de OS, contratos e compras. Permanecem fora desta etapa: medições e financeiro completo, cobertura automática de garantia, evidências de qualidade, agenda individual, máquinas, chat, notificações, folha trabalhista, conversão automática de imagens e validação de provedores externos.
