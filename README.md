# Obra360

Gestão da construção com React, TypeScript e API Java 21/Spring Boot. O modo padrão consulta o banco de dados; os dados de demonstração só aparecem quando habilitados explicitamente.

Autores: João Pedro e Marcos Henrique. O material acadêmico anterior está preservado em [docs/README-legado.md](docs/README-legado.md), como histórico; suas afirmações de integrações e conformidade não descrevem o estado atual.

Controle de sessões, MFA, convites, limites, exportação privada e atendimento estão descritos em [Preparação comercial](docs/COMERCIALIZACAO.md), junto às pendências para contratação e operação com clientes reais. Não há cobrança automática nem aceite de cliente real comprovado.

A interface conectada alterna entre os temas **Claro e Escuro** com um toque no botão de sol ou lua, com preferência salva no navegador e layout adaptável a celular, tablet e desktop. Uso e dimensões testadas estão em [Aparência e responsividade](docs/APARENCIA-RESPONSIVIDADE.md). A cobertura por perfil, os processos testados e os limites da confirmação estão em [Validação funcional](docs/VALIDACAO-FUNCIONAL.md). `npm run test:roles` percorre os quinze perfis nos dois temas e verifica a matriz de permissões da API em base isolada.

## Executar a instalação local

Pré-requisitos: Node.js 20.19+ ou 22.12+, Java 21 e Maven no PATH.

```powershell
npm ci
npm run configurar:seguranca-local
npm run dev
```

O comando inicia a API em `127.0.0.1:8080`, aguarda o banco ficar disponível e inicia a interface em `http://localhost:3000`. Mantenha o terminal aberto. Ctrl+C encerra os processos iniciados pelo comando. As portas 8080 e 3000 precisam estar livres.

No primeiro acesso, cadastre os dados reais da empresa e a conta de administrador. Não existe senha padrão nem usuário de demonstração no modo real. A senha deve ter pelo menos 12 caracteres. O CNPJ é registrado como informado; não há consulta cadastral à Receita Federal.

O banco H2 persistente é criado em `obra360-backend/data/obra360.mv.db`. Esse diretório não entra no Git. Faça cópias de segurança com a aplicação encerrada. Não apague o diretório para reiniciar a aplicação: isso apaga os cadastros. O perfil `dev` usa H2 em memória e destina-se aos testes; o perfil `local` usa arquivo e é iniciado por `npm run dev`.

Após entrar, abra **Usuários**, cadastre um usuário com perfil **ENGENHEIRO** ou **GERENTE OBRA** e crie o empreendimento selecionando esse responsável. O cadastro de usuários pertence sempre à empresa autenticada.

A tela de acesso oferece escolha de perfil por nível, e-mail, senha e Google. O perfil escolhido deve corresponder ao cadastro. A opção automática identifica o perfil da conta. Use o ícone de olho para mostrar ou ocultar a senha. O campo de código aparece após a validação da senha para contas com autenticação em duas etapas ativa. O login por Google requer GOOGLE_CLIENT_ID configurado e uma conta vinculada.

## O que está integrado ao banco

- Configuração inicial de empresa e administrador, uma única vez em uma base vazia.
- Login com senha BCrypt, token assinado e verificação de conta ativa.
- Cadastro e edição de usuários e empreendimentos por perfis autorizados; desativação de contas e alteração de senha com invalidação das sessões anteriores.
- Consultas paginadas de empreendimentos, estoque, documentos, cronograma, qualidade, equipes, ordens, contratos, cotações, unidades, garantias e auditoria.
- Restrição por empresa e controle de acesso às consultas administrativas e financeiras.
- Cadastro de equipes, materiais, fornecedores, contratos, ordens, etapas de cronograma, ocorrências, unidades, cotações e chamados de garantia.
- Entradas e saídas de estoque, consumo de materiais por ordem e encerramento de ordens com transações, validação de saldo e controle de repetição de operações.
- Envio, download e novas versões de documentos locais (até 20 MB por arquivo).
- Resumo de ordens abertas/atrasadas, materiais abaixo do mínimo e custo de consumo calculado a partir dos custos unitários cadastrados.
- Eventos de auditoria para os novos cadastros, movimentações e alterações de situação, vinculados ao usuário e à empresa.

As consultas exibem os registros efetivamente existentes. Banco vazio produz tela vazia; erro de API produz erro visível. As operações disponíveis dependem do perfil. Perfis de cliente, fornecedor, corretor, locador e investidor ainda não recebem um portal operacional próprio. Veja o percurso completo em [docs/OPERACAO.md](docs/OPERACAO.md).

O backend antigo continha endpoints sem isolamento suficiente. Eles estão bloqueados por padrão; o modo real usa `/api/v1/workspace/**`. Consumidores externos dos endpoints antigos precisarão ser migrados para os contratos seguros. Os serviços e telas históricos foram preservados para revisão e demonstração.

## Integrações que ainda não estão implementadas

S3, Google, IA e consulta SEFAZ têm conectores implementados; sua ativação e validação real dependem das credenciais e contas. IFC e portais externos estão disponíveis. Veja [docs/INTEGRACOES.md](docs/INTEGRACOES.md). Sincronização Supabase não foi implementada. Validar o dígito da NF-e não comprova autorização fiscal. O projeto não possui certificação de conformidade LGPD/ISO/NR nem auditoria externa.

O armazenamento padrão de documentos é local (S3 é configurável), em `obra360-backend/data/documentos`. O MongoDB do Compose não é usado pela auditoria atual: os eventos persistem em tabela relacional. A auditoria não oferece garantia de imutabilidade. Os listeners Kafka históricos ficam desabilitados.

## PostgreSQL e execução fora do computador local

O perfil padrão é `local`. Para usar PostgreSQL, ative explicitamente um perfil de produção e configure no ambiente do processo Java:

```text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/obra360_db
SPRING_DATASOURCE_USERNAME=USUARIO
SPRING_DATASOURCE_PASSWORD=SENHA
JWT_SECRET=SEGREDO_ALEATORIO_COM_PELO_MENOS_32_BYTES
```

Execute a API a partir de `obra360-backend` com `mvn spring-boot:run`. As migrações Flyway são usadas em PostgreSQL; o perfil local usa a geração de schema do Hibernate. As quatorze migrações foram validadas em PostgreSQL temporário real; o ambiente de destino ainda precisa ser validado antes da publicação. Uma migração de H2 para PostgreSQL requer exportação/importação planejada; trocar o perfil não transfere dados.

A instalação inicial pública fica desabilitada no perfil de produção. Se uma base PostgreSQL estiver vazia, habilite `SETUP_ENABLED=true` somente durante uma configuração supervisionada, com acesso restrito, e desabilite depois. Uma base que já tenha empresa ou usuário não permite reabrir o cadastro inicial.

Os tokens locais expiram em uma hora e são invalidados ao reiniciar a API quando `JWT_SECRET` não estiver definido. Eles ficam no sessionStorage do navegador, não em um usuário simulado no localStorage. Não compartilhe os arquivos do banco ou segredos no Git.

O frontend usa `VITE_API_URL=/api`; o Vite encaminha essas chamadas para a API local. Para desenvolver somente a interface: `npm run dev:frontend`. Para publicar, gere `npm run build`, sirva `dist` e configure um proxy `/api` para o backend com HTTPS. O JAR não publica os bundles antigos da demonstração.

## Validação

```powershell
npm run build
npm test
npm run test:backup
npm run test:integrated
npm run test:postgres
npm audit
```

```powershell
cd obra360-backend
mvn test --batch-mode
```

Os testes Playwright padrão verificam a interface com respostas HTTP controladas. A suíte integrada inicia uma API na porta 8081 e um frontend na 4175, com H2 em memória e documentos sob `target/e2e-documents`; ela percorre a instalação, cadastros, entrada e consumo de estoque, encerramento de ordem, download de documento e troca de senha sem mocks HTTP. A suíte Java testa também concorrência de baixas, idempotência, permissões e as migrações V1 a V14 em banco H2 isolado. Os dados desses testes não são inseridos na instalação local.

Para executar apenas o histórico demonstrativo: `npm run dev:demo`. A faixa superior identifica que os dados são fictícios. `npm run test:demo` executa a suíte legada separadamente; seus resultados não comprovam integrações externas.

Veja [docs/AUDITORIA.md](docs/AUDITORIA.md) para os achados, correções e limitações de verificação.

## Recursos humanos

Área operacional de RH disponível para SUPER_ADMIN e RH: funcionários, departamentos/cargos, ponto, férias/afastamentos, benefícios, folha manual, treinamentos/exames e recrutamento. Veja [docs/RH.md](docs/RH.md) para uso e limites. Não inclui cálculo tributário ou envio ao eSocial.

O RH também possui documentos privados versionados e histórico funcional com justificativa das mudanças salariais, de cargo, vínculo, jornada e alocação.

## Modelador 2D/3D real

Vários modelos por obra, pavimentos, paredes, lajes, pilares, portas e janelas com medidas em metros, planta editável e vista 3D. O banco guarda revisões; cópias, restauração e exportação/importação JSON são disponíveis conforme perfil. Veja [docs/MODELADOR.md](docs/MODELADOR.md) para uso e limites.

## Homologação persistida

A instalação local foi preenchida, a pedido, com empresa e contas de teste identificadas como HOMOLOGACAO. Os dados estão no banco, mas não representam pessoas/empresas reais. Acesse as credenciais em ACESSO-HOMOLOGACAO.local (ignorado pelo Git). Consulte [docs/HOMOLOGACAO.md](docs/HOMOLOGACAO.md). O diagnóstico administrativo está em Qualidade dos dados.
