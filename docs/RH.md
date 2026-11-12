# Recursos humanos

O módulo operacional fica em **Recursos humanos**, no menu lateral. Somente **SUPER_ADMIN** e **RH** podem acessar seus endpoints e telas. O administrador cria contas com perfil RH em **Usuários**. Novos funcionários recebem uma conta COLABORADOR vinculada, com senha inicial aleatória e troca obrigatória no primeiro acesso. O cargo não concede permissões de gestão. Consulte [Acesso do funcionário](RH-ACESSO-FUNCIONARIO.md).

## Fluxo inicial

1. Em **Departamentos e cargos**, cadastre departamentos e depois cargos vinculados. Os nomes são únicos por empresa e tipo. Estruturas em uso não podem ser desativadas; um cargo não pode ser transferido para outro departamento.
2. Em **Funcionários**, informe matrícula, CPF válido, admissão, vínculo, departamento, cargo, remuneração e jornada semanal em minutos. O e-mail individual é obrigatório no novo cadastro e será o login. Telefone, nascimento, obra e equipe são opcionais. É possível vincular explicitamente uma conta existente, conforme as permissões. A equipe precisa pertencer à obra selecionada. Uma jornada de 44 horas corresponde a 2.640 minutos; o campo apenas registra a jornada informada, sem avaliar sua adequação contratual.
3. Registre jornadas, ausências, benefícios, treinamentos e demais operações usando o funcionário cadastrado. Os seletores permitem buscar pelo nome e mostram até 200 resultados por consulta. As listas têm filtros e paginação. Nos formulários, cargos dependem do departamento e equipes dependem da obra; alterar a seleção principal limpa o vínculo dependente.

Matrícula, CPF e conta vinculada possuem unicidade por empresa. O CPF fica mascarado nas listas, e o formulário de edição, autorizado a RH, recebe o valor completo. CPF e admissão ficam bloqueados após o cadastro. Alterações simultâneas são recusadas pela versão do registro, evitando sobrescrever uma edição mais recente.

## Recursos disponíveis

| Área          | Operações                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Funcionários  | Cadastrar, consultar, editar, alocar em obra/equipe, vincular conta existente e registrar desligamento                     |
| Estrutura     | Cadastrar e editar departamentos/cargos, ativar e desativar quando não houver dependências ativas                          |
| Jornada       | Registrar entrada, intervalo e saída no mesmo dia; calcular minutos; editar enquanto pendente e aprovar                    |
| Ausências     | Solicitar férias, licença, atestado, falta e folga; editar enquanto pendente; aprovar, rejeitar e cancelar aprovação       |
| Benefícios    | Registrar benefício individual, vigência, custo da empresa, participação do funcionário e desativação                      |
| Folha         | Abrir competência, registrar/excluir rubricas manuais, conferir totais, fechar e registrar pagamento já realizado          |
| Demonstrativo | Consultar proventos, descontos e líquido por funcionário e competência                                                     |
| Capacitações  | Registrar treinamentos, certificações e datas administrativas de exames; realização, instituição, carga horária e validade |
| Recrutamento  | Abrir/editar/pausar/encerrar vagas e acompanhar candidatos por etapa; editar e excluir candidatos                          |
| Indicadores   | Funcionários ativos, ausências pendentes, registros vencidos ou a vencer até 30 dias e vagas abertas                       |

O desligamento preserva o histórico e bloqueia novas solicitações de ausência para o funcionário. A conta vinculada é desativada, suas sessões são invalidadas e o histórico é preservado. Não há exclusão física de funcionários, ponto aprovado ou folha fechada. Candidatos e lançamentos de folha aberta podem ser excluídos após confirmação. O log registra a operação, usuário e identificador, sem copiar CPF, dados médicos ou conteúdo completo dos cadastros.

## Regras da folha e jornada

Cada folha tem uma competência única por empresa. Rubricas são únicas por código, funcionário e folha. Valores positivos e natureza PROVENTO/DESCONTO determinam os totais. O funcionário deve ter vínculo na competência. Não são criados salários, descontos ou tributos automaticamente. Benefícios e ponto não geram rubricas: o responsável informa os valores conferidos.

Folha vazia ou com líquido negativo de algum funcionário não pode ser fechada. Depois de fechada, não aceita inclusão ou exclusão de lançamentos. Registrar pagamento exige folha fechada e data não futura; essa operação registra uma informação administrativa e não transfere dinheiro. O demonstrativo reflete somente os lançamentos cadastrados.

Ponto aceita uma jornada por dia e funcionário, dentro do vínculo, sem datas futuras. As marcações precisam estar em ordem e o intervalo exige saída e retorno. Não suporta jornada atravessando a meia-noite. Ponto aprovado não pode ser editado. Ausências aprovadas do mesmo funcionário não podem se sobrepor; as datas são inclusivas.

## Escopo e limites

Esta é uma área administrativa de RH integrada ao banco. Não é um motor de folha fiscal, registrador eletrônico de ponto certificado ou serviço de medicina ocupacional. Não calcula INSS, IRRF, FGTS, adicionais, banco de horas, férias adquiridas, 13º, rescisões nem realiza envio ao eSocial. Não há avaliação automática de exigências por função/NR. O autoatendimento permite consulta do próprio cadastro, ponto, ausências, benefícios e demonstrativos. Integração com folha especializada e relógio de ponto exige uma etapa própria.

Não cadastre diagnósticos, laudos médicos ou documentos sensíveis nos módulos gerais de documentos, que possuem permissões operacionais mais amplas. O RH registra apenas o tipo de exame, datas e responsável, sem prontuário clínico.

As tabelas são novas (`rh_*`) e segregadas por empresa. As migrações são V11 (cadastros) e V12 (dossiê/histórico). A tabela legada `colaborador` não foi importada automaticamente: sua origem, CPF, vínculo e empresa precisam ser verificados antes de cadastrar os funcionários reais. Nenhum funcionário fictício foi incluído na base local.

## Validação

Testes de API cobrem acesso por perfil/empresa, CPF mascarado e inválido, versão de edição, estruturas em uso, jornada e intervalo, aprovação, sobreposição de ausências, desligamento, benefícios, treinamentos, recrutamento e folha fechada. A mesma suíte roda em PostgreSQL real isolado. A jornada de navegador usa API e banco de teste reais para cadastrar funcionário, editar, aprovar ponto, lançar, fechar e registrar pagamento na folha, e consultar demonstrativo. Os dados de teste não entram no banco operacional.

## Documentos privados

Em **Recursos humanos → Documentos privados**, selecione o funcionário e envie PDF, PNG ou JPEG de até 20 MB. A extensão e a assinatura inicial do conteúdo precisam ser compatíveis. As categorias incluem admissão, contrato, aditivo, comprovante, certificado e desligamento. É possível informar validade.

**Nova versão privada** preserva o arquivo anterior, o título, a categoria e o funcionário, com numeração sequencial por grupo. Use a versão mais recente para continuar a sequência. Arquivos ficam em um namespace separado dos documentos de obra: `data/documentos/rh` no armazenamento local. Referências internas não são entregues na API. Os nomes recebidos não determinam o caminho.

Downloads exigem SUPER_ADMIN ou RH da mesma empresa, são entregues como anexos com cache desabilitado e conferem tamanho/SHA-256 antes da entrega. Consultas, downloads, envios e arquivamentos são registrados na auditoria. Arquivar é reversível e preserva arquivo e versões; não constitui exclusão definitiva nem anonimização. A opção **Incluir documentos arquivados** permite reativar e consultar essas versões.

O backup local inclui a subpasta RH porque copia o diretório de dados completo. Não há antivírus, assinatura digital ou criptografia própria desses arquivos; acesso ao sistema operacional deve ser restrito. A verificação do cabeçalho não comprova que um documento é seguro ou autêntico. O módulo não é prontuário médico e não deve receber laudos clínicos.

## Histórico funcional

A aba **Histórico funcional** mostra os valores anteriores e novos, motivo, responsável e horário do registro. Novas admissões passam a gerar o primeiro evento automaticamente. Salário/valor contratual, vínculo, departamento, cargo, jornada e alocação em obra/equipe exigem **Motivo da alteração funcional** ao editar o funcionário. O registro ocorre na mesma transação; falhas não confirmam a alteração. Alterações de contato não copiam telefone/e-mail para o histórico.

São preservados nomes de cargos/departamentos e valores observados no momento da alteração. CPF, nascimento, contatos, senhas e informações clínicas não fazem parte dos snapshots. Não existe endpoint para editar/apagar eventos. O histórico é relacional e não oferece garantia criptográfica contra alterações feitas diretamente por administradores do banco.

Funcionários já existentes não recebem uma admissão retroativa fictícia. Na primeira alteração funcional rastreada, o sistema registra a **BASE INICIAL** observada antes da mudança e depois o evento de alteração. A data de referência da base é o dia em que foi observada; a data de registro sempre identifica quando o evento entrou no sistema. Desligamento guarda a data informada. Mudanças funcionais são imediatas; não há agendamento ou cálculo retroativo da folha, e folhas já lançadas não são recalculadas.
