# Treinamento e entrega ao cliente

Roteiro preparado em 15/11/2026. É um plano de trabalho; não registra treinamento realizado, contrato firmado ou aceite de uma empresa real.

## Preparação

O responsável pela implantação registra a versão e o hash da entrega, os módulos contratados, computador/servidor de destino, responsáveis de cada área, volume estimado, canal e horário de suporte. Preencher [modelos/implantacao-cliente.json](modelos/implantacao-cliente.json). Não colocar senhas, certificados nem dados pessoais nesse arquivo versionado; mantenha a ficha preenchida em local privado.

Use uma base de treinamento separada, identificada como fictícia. Explique a diferença entre registro persistido e informação verdadeira da operação. Não lançar pagamentos ou documentos fictícios na empresa de operação.

## Sessões práticas sugeridas

| Participantes          | Tempo de referência | Exercício e resultado a conferir                                                                                                                         |
| ---------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador          | 20 min              | Entrar, trocar senha, criar acesso com perfil apropriado, revogar sessão, conferir auditoria e abrir atendimento                                         |
| Gerência e engenharia  | 30 min              | Criar obra, orçamento, equipe e OS; conferir encarregado, membros, etapas e bloqueios de vínculos inválidos                                              |
| Compras e almoxarifado | 30 min              | Pedido de dois materiais, aprovações distintas, entrega parcial, integral e devolução; conferir saldo físico e custo                                     |
| Financeiro             | 30 min              | Conferir conta originada do pedido, baixa parcial com comprovante, CSV do extrato, conciliação e crédito por devolução                                   |
| RH                     | 30 min              | Cadastro e acesso inicial, primeiro login, ponto e ausências, lançamentos/fechamento e exportação para contabilidade; desligamento com acesso desativado |
| Modelagem              | 30 min              | Calibrar uma referência, conferir sugestões de paredes, editar aberturas, salvar/reabrir, publicar revisão e conferir escala física                      |
| Operador local         | 20 min              | Diagnosticar, fazer backup com a API parada, restaurar em ambiente separado e conferir dados e documentos                                                |

Os tempos são uma proposta de agenda, não SLA nem garantia de aprendizado. Para cada sessão, registrar participantes, versão, data, exercícios, dúvidas, evidências e pendências. Após correções, repetir o exercício que falhou.

## Atendimento e incidentes

As solicitações da interface são internas e acompanhadas pelo administrador da empresa; não são encaminhadas automaticamente a uma equipe externa. Antes da contratação, indicar quem as monitora e o canal externo para quando o sistema estiver indisponível. Definir horário, prazo de primeira resposta e escalonamento por escrito com o cliente.

Em divergência de estoque, financeiro ou acesso, preservar os registros e evidências, suspender a operação afetada e acionar o responsável. Não corrigir dados diretamente no banco sem diagnóstico, backup e procedimento registrado. Não restaurar a base em uso só por causa de um alerta.

## Definições comerciais e revisão profissional pendentes

O responsável comercial deve preencher módulos, preço, período do piloto, limites, suporte, critérios de aceite, atualização e encerramento. O responsável jurídico deve revisar o contrato, privacidade, responsabilidades, retenção, portabilidade e tratamento de incidentes. Este roteiro não substitui essa revisão nem atribui conformidade legal ao produto.

A contabilidade precisa validar classificações e regras trabalhistas antes de qualquer implementação/ativação oficial de folha, rescisão ou eSocial. Os provedores opcionais permanecem desativados até que existam contas e homologação. Uma revisão independente de segurança precisa ser realizada por responsável externo à implementação.

## Encerrar o piloto

Preencher privadamente o modelo dos 16 cenários de aceite com evidências e responsáveis reais. Rodar `npm run validar:piloto -- <relatorio-privado.json>` para conferir sua estrutura. Um relatório técnico sintético, inclusive o deste projeto, não satisfaz o aceite humano. Havendo pendência crítica, registrar correção e novo teste antes da decisão comercial.
