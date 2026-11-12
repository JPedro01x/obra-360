# Consultar cadastros e vínculos

Na tabela dos módulos operacionais, clique no nome do registro ou em **Ver detalhes**. A consulta abre uma janela com os dados gravados no banco e os vínculos disponíveis para seu perfil. Não altera os cadastros.

Na obra, a visão reúne engenheiro, equipes e encarregados, membros alocados pelo RH, etapas, OS, contratos, estoque, documentos, plantas 2D/3D, clientes vinculados aos portais, unidades e ocorrências de qualidade. Cada lista mostra dez registros por página e o total de vínculos. A quantidade declarada de operários de uma equipe pode diferir dos funcionários efetivamente alocados; as duas informações são exibidas separadamente.

**Ver detalhes** em um vínculo abre seu cadastro. **Voltar ao cadastro anterior** retorna à consulta de origem. **Atualizar detalhes** consulta novamente o banco. **Abrir planta** abre o modelo selecionado diretamente no editor, mantendo as permissões de edição já existentes. Documentos podem ser baixados pelos perfis autorizados.

Equipes mostram membros e OS; fornecedores mostram contratos e cotações; contratos mostram obra, fornecedor e OS; OS mostram equipe, membros e consumo; materiais mostram movimentações e compras; compras mostram material e propostas; cotações mostram fornecedor e requisição; unidades mostram coberturas e chamados. Documentos, etapas, ocorrências e acessos também permitem consultar os vínculos cadastrados. Usuários mostram obras e equipes sob sua responsabilidade. Registros sem relacionamento disponível mostram seus dados principais.

## Interpretação dos indicadores

- **Evolução:** média simples do percentual executado das etapas cadastradas. Sem etapas, aparece “Não informado”. Não usa o tempo transcorrido como progresso físico nem aplica pesos que não foram cadastrados.
- **VGV estimado:** estimativa de vendas, não investimento.
- **Investimento aprovado:** não há orçamento específico disponível nessa visão; fica “Não informado”.
- **Contratos ativos:** soma dos contratos ativos, não comprovação de pagamento.
- **Materiais consumidos:** soma dos custos registrados em consumo de OS.
- **Compras recebidas:** soma dos valores das movimentações vinculadas às requisições recebidas. Não deve ser somada ao consumo dos mesmos materiais como se fosse uma despesa diferente.

Não existe um indicador de gasto total que misture esses conceitos. Folha, despesas sem lançamento e pagamentos não registrados não são estimados pela tela.

## Permissões e dados pessoais

A API verifica empresa e permissão do registro principal e dos módulos relacionados. Um vínculo não concede acesso a um módulo restrito. A visão operacional de membros contém somente identificação, nome, cargo, equipe e situação; não inclui CPF, salário, documentos pessoais ou credenciais. O RH continua em sua área separada.

Clientes aparecem conforme os vínculos efetivamente cadastrados no portal; essa relação não comprova propriedade nem substitui contrato de venda. Plantas arquivadas são identificadas na consulta e continuam sujeitas às regras do modelador.
