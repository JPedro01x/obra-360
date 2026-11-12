# Cadastro de funcionário com conta de acesso

Implementação de 11/11/2026. Atualiza a descrição anterior, na qual cadastro funcional e criação de conta eram etapas separadas.

## Novo cadastro

1. Acesse Recursos humanos → Funcionários → Cadastrar funcionário.
2. Informe os dados funcionais e um e-mail válido e individual. Esse e-mail será o login da nova conta.
3. Salve o cadastro. Na mesma transação, o backend cria o funcionário, a conta e o vínculo entre eles.
4. A tela Acesso do funcionário criado apresenta o login e uma senha inicial aleatória. Use Visualizar senha para consultá-la e entregue os dados ao funcionário por um canal privado.
5. Ao fechar a tela, a senha deixa de estar disponível para consulta. Não há envio automático de e-mail neste fluxo.

A criação ocorre independentemente do cargo, departamento ou tipo de vínculo. O cargo não determina privilégios: as novas contas recebem o perfil COLABORADOR. O administrador pode conceder outro perfil separadamente, conforme a responsabilidade e a autorização da empresa.

O banco armazena apenas hash BCrypt da senha. A senha inicial não é colocada no cadastro funcional, histórico, auditoria ou armazenamento do navegador. A resposta imediata da criação contém a credencial para sua entrega; consultas posteriores não a retornam.

## Primeiro acesso

O funcionário entra com o e-mail e a senha inicial e define uma senha pessoal diferente. Antes disso, o backend autoriza somente consulta da sessão, alteração de senha e saída. A exigência não depende apenas da interface.

A senha pessoal precisa cumprir os limites da aplicação. A troca invalida as sessões anteriores e exige novo login. O fluxo de recuperação por e-mail, quando configurado, também permite definir a senha sem recuperar a anterior.

## Conta já existente

O campo Conta de acesso vinculada permite reutilizar uma conta interna ativa da mesma empresa. Essa operação não gera nem revela uma nova senha e não altera o perfil da conta. Uma conta não pode ser vinculada a dois funcionários por estes fluxos.

O RH pode vincular novas contas de Colaborador; vínculos com contas de gestão exigem SUPER_ADMIN. Na edição de um funcionário, um vínculo já existente é preservado quando o campo não é informado. A substituição do vínculo exige administrador.

Se um e-mail já estiver em uso, a aplicação pede a vinculação explícita da conta existente ou outro e-mail. Não há vinculação silenciosa por coincidência de endereço. O cadastro também respeita o limite de usuários da empresa, incluindo vagas reservadas por convites.

Registros funcionais antigos sem conta não são convertidos automaticamente por esta migração. Eles podem receber uma conta existente pela edição autorizada. Editar dados funcionais não redefine a senha nem altera automaticamente o e-mail de login.

## Área do colaborador

O perfil Colaborador abre Meu cadastro, que permite consultar:

- Nome, matrícula, departamento, cargo, admissão, situação e jornada cadastrada.
- Seus próprios registros de ponto, com paginação.
- Demonstrativos de folhas FECHADA ou PAGA com lançamentos em seu nome.

O servidor identifica o funcionário a partir do usuário autenticado e da empresa. Parâmetros enviados pelo navegador não selecionam outro funcionário. O demonstrativo contém apenas os lançamentos e totais individuais, sem totais de outros empregados ou da folha empresarial. Os valores continuam sendo os lançamentos administrativos do RH; esta funcionalidade não acrescenta cálculos trabalhistas automáticos.

O perfil não permite acessar a administração do RH, usuários, obras, compras ou modelos internos. A interface inclui os temas existentes e navegação por celular. A gestão de documentos privados de RH continua restrita aos responsáveis autorizados; ela não foi liberada integralmente ao colaborador.

## Desligamento

O desligamento desativa a conta vinculada e invalida suas sessões. O histórico funcional é preservado. Contas com acesso de gestão exigem que o desligamento seja registrado por administrador, e não é permitido desativar a própria conta por esse fluxo. Isso evita que a mudança de um cadastro funcional remova indevidamente o acesso de gestão.

## Persistência e testes

A migração V26 adiciona o indicador de troca obrigatória e um índice do vínculo de usuário. Os registros anteriores recebem o padrão de não exigir troca; não são geradas novas senhas para usuários antigos. O perfil local utiliza atualização pelo Hibernate com o mesmo padrão.

Foram adicionados testes para criação e hash, primeiro acesso, troca e revogação, preservação de contas existentes, e-mail duplicado, limites, prevenção de escalada de perfil, isolamento de ponto/demonstrativos e desativação no desligamento. A jornada integrada realiza cadastro, entrega da senha inicial na tela, login, troca e acesso pessoal com API e banco isolados.

Os resultados finais estão nos logs locais test-results/rh-acesso-backend.log, test-results/rh-acesso-postgres.log, test-results/rh-acesso-ui.log e test-results/rh-acesso-integrated.log. Os dados utilizados nesses testes são fixtures identificadas e não alteram os cadastros da instalação local.

Resultados de 11/11/2026: build TypeScript/Vite aprovado; 78 testes Java executados sem falhas (61 testes condicionais PostgreSQL ignorados nessa execução e executados separadamente); 61 testes aprovados em PostgreSQL com as 26 migrações; 53 cenários de interface aprovados; uma jornada integrada sem mocks HTTP aprovada, incluindo criação da conta, troca da senha inicial e acesso à área pessoal.

As melhorias de OS, contratos e compras da etapa anterior permanecem disponíveis e são verificadas junto com a regressão. Os demais módulos do roteiro geral continuam sujeitos às suas etapas de implementação e aceite.
