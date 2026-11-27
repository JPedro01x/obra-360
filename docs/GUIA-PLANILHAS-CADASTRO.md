# Guia: cadastros por planilha Excel

O menu **Importar e exportar planilhas** permite baixar modelos `.xlsx`, validar arquivos antes de gravar e exportar cadastros da empresa selecionada. Os arquivos são processados no servidor e cada operação respeita a empresa (tenant) da sessão.

Atualmente este fluxo cobre somente **funcionários** e **empreendimentos**. Projetos 2D/3D, fornecedores, estoque, ordens de serviço, equipes e os demais cadastros são mantidos em seus módulos próprios; não há modelos de planilha para eles nesta versão.

## Funcionários

O acesso é restrito a **RH** e **SUPER_ADMIN**. Baixe o modelo e preencha a aba `Dados`, sem alterar a linha de cabeçalho. São obrigatórios: matrícula, nome, CPF, e-mail, admissão, vínculo, departamento, cargo, salário-base e jornada semanal em minutos. Datas aceitam `dd/mm/aaaa` ou células de data do Excel. Departamento e cargo devem estar ativos; cargo precisa pertencer ao departamento. Obra e equipe são opcionais, mas equipe exige obra.

Ao confirmar, o sistema cria a ficha funcional e uma conta interna `COLABORADOR`, com troca obrigatória da senha no primeiro acesso. A senha inicial é retornada uma única vez na tela da importação; entregue-a por canal privado. Ela não é gravada na ficha, auditoria ou arquivo exportado. O e-mail precisa ser único e a licença precisa ter vagas para todos.

## Projetos

O acesso é restrito a **SUPER_ADMIN**, **GERENTE_OBRA** e **INCORPORADOR**. Preencha nome do projeto, e-mail do engenheiro responsável, VGV, área e datas. O engenheiro ou gerente indicado deve estar ativo na mesma empresa. Nomes repetidos na empresa ou no lote são bloqueados.

## Prévia, limites e exportação

Use **Validar planilha** para ver os erros por linha. A confirmação só fica disponível quando todas as linhas estão válidas; a importação é integral, dentro de uma transação. Os limites são 5 MB e 500 linhas por arquivo. Fórmulas, cabeçalhos diferentes e colunas adicionais são rejeitados. Se o arquivo mudar após a prévia, será necessário validar de novo.

Os botões de exportação baixam os dados do tipo selecionado, limitados à empresa da sessão. A exportação de funcionários contém CPF e salário-base e, por isso, deve ser guardada e compartilhada com cuidado. Nenhuma exportação contém senha, hash de senha ou token.
