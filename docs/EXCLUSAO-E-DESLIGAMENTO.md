# Exclusão de cadastros e desligamento

Na tabela do módulo, use a ação de exclusão e digite o nome atual do cadastro para confirmar. A permissão também é verificada na API, independentemente da interface.

| Ação                 | Perfis autorizados                                  |
| -------------------- | --------------------------------------------------- |
| Excluir obra         | SUPER_ADMIN, GERENTE_OBRA, INCORPORADOR             |
| Excluir fornecedor   | SUPER_ADMIN, GERENTE_OBRA, FINANCEIRO, INCORPORADOR |
| Excluir equipe       | SUPER_ADMIN, GERENTE_OBRA, ENGENHEIRO, MESTRE_OBRA  |
| Desligar funcionário | SUPER_ADMIN, RH                                     |

Obras, fornecedores e equipes com registros vinculados não podem ser excluídos. A API responde com conflito e preserva os registros. Isso inclui histórico de funcionários e ordens de serviço, contratos, plantas e elementos BIM legados. Cadastros de outra empresa não podem ser manipulados. As exclusões bem-sucedidas ficam na auditoria.

Em **Recursos humanos → Funcionários → Desligar**, informe a data do desligamento. O funcionário fica com status DESLIGADO e sua conta é desativada, invalidando seu acesso. Seus registros e histórico são preservados. O RH não pode desativar contas administrativas; esses casos exigem SUPER_ADMIN. O usuário também não pode desligar a si próprio.

Esse desligamento é administrativo: não calcula verbas rescisórias nem executa pagamentos ou obrigações legais.
