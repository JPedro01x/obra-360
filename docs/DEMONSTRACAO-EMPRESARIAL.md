# Construtora Horizonte — demonstração persistida

Empresa e todos os registros são fictícios, criados para apresentar os módulos do Obra360. O ambiente está marcado como `HOMOLOGACAO`; estes dados não têm validade empresarial, fiscal, trabalhista, financeira ou executiva.

## Instância isolada

A demonstração foi criada em um banco H2 separado, em `obra360-backend/data/demonstracao/obra360-demo.mv.db`. Ela roda localmente em [http://127.0.0.1:3001](http://127.0.0.1:3001), com API em `127.0.0.1:8081`. A instância operacional anterior foi mantida em execução, sem alterações; ela continua nas portas e no banco próprios.

O banco persiste os dados fora do código e das fixtures do frontend. Arquivos de progresso, documentos e credenciais também ficam em pastas locais ignoradas pelo Git. As senhas de demonstração são aleatórias e ficam cifradas em `ACESSO-DEMONSTRACAO.local`; não compartilhe esse arquivo.

## Dados conferidos

| Área | Quantidade |
| --- | ---: |
| Empresa fictícia | 1 |
| Projetos/obras | 9 (inclui escola, hospital e praça demonstrativos) |
| Equipes | 18 |
| Contratos | 18 |
| Materiais e saldos conferidos | 60 |
| Ordens de serviço | 72 |
| Requisições de compra | 18 |
| Documentos PDF demonstrativos | 12 |
| Unidades imobiliárias | 12 |
| Chamados de garantia | 6 |
| Etapas do cronograma | 18 |
| Usuários | 68 |
| Funcionários de RH | 57 |
| Registros de ponto | 240 |
| Benefícios | 48 |
| Treinamentos | 48 |
| Folha administrativa | 1 folha, 96 lançamentos manuais |
| Modelos de plantas 2D/3D persistidos | 15 |
| Orçamentos aprovados preparados na carga | 6 |
| Títulos a pagar/receber preparados na carga | 18 |
| Baixas e conciliações bancárias preparadas na carga | 8 |
| Pedidos financeiros preparados na carga | 6 |
| Solicitações de atendimento preparadas na carga | 6 |

Os números acima representam módulos com registros persistidos e conferidos pela API. As linhas financeiras e de atendimento são a cobertura preparada no carregador; ainda dependem da execução da carga e da conferência no banco isolado, portanto não devem ser apresentadas como contagens persistidas até a confirmação em `--verificar`. Algumas telas do protótipo ainda usam estado local e não fazem parte dessas contagens.

Os projetos incluem Residencial Aurora, Condomínio Jardim das Palmeiras, Edifício Comercial Central, Residencial Vista Verde, Centro Logístico Horizonte e Vila das Acácias, além da Escola Parque Horizonte, Hospital Regional Horizonte e Praça das Acácias. Todos têm indicação de demonstração.

## Processos representados

- Ordens de serviço abertas, em andamento e concluídas, com consumos relacionados aos projetos.
- Compras recebidas, com pedido emitido ou em aprovação. Aprovações e pedidos são registros internos de demonstração; nenhuma solicitação foi enviada a um fornecedor externo e nenhum pagamento foi feito.
- RH com funcionários, ponto, benefícios, treinamentos, afastamentos fictícios e lançamentos manuais. Não foram calculados tributos ou direitos trabalhistas.
- Plantas diversificadas incluem casa térrea, condomínio vertical, edifício comercial, residência de dois pavimentos, galpão logístico, vila com praça, escola, hospital e praça pública. Os 15 modelos demonstrativos têm implantações, escalas, pavimentos e ambientes variados, com revisões persistidas; os modelos originais mantêm publicação vinculada a unidades quando aplicável. São exemplos esquemáticos, não projetos executivos, e precisam de validação técnica profissional.
- Acessos de cliente, corretor, investidor e parceiros vinculados a obras/unidades para demonstrar níveis distintos de acesso.
- Arquivos PDF identificados como demonstração sem validade real.

## Módulos sem dados persistidos nesta demonstração

- A tela antiga **Conciliação de NF-e** ainda exibe exemplos locais de demonstração. No Workspace operacional, **Notas fiscais** grava cabeçalho, fornecedor, itens, estados e eventos no banco da empresa; a entrada de estoque é uma ação separada e transacional. O fluxo não importa XML nem autentica a NF-e na SEFAZ. V39 é necessária no PostgreSQL e ainda não foi aplicada nesta cópia.
- O chat interno no `Workspace` tem fluxo tenant-aware para conversa, envio e leitura; a interface antiga de demonstração continua simulada e sem atualização em tempo real. As rotas B2B legadas permanecem bloqueadas; no portal operacional, o fornecedor vê requisições abertas de obras vinculadas e pode registrar uma proposta interna. Isso não transmite pedido a software externo. As migrações V35-V40 precisam ser aplicadas pela inicialização autorizada antes de disponibilizar as mudanças nesta instância. Medições têm API, histórico, fluxo de aprovação e anexos de evidência no código; não há medições demonstrativas carregadas. Liberação financeira apenas registra estado interno; não realiza pagamento nem faturamento externo.
- O simulador de upload 3D é visual; não importa nem salva modelo BIM/IFC. As 15 plantas geométricas persistidas podem ser visualizadas no modo 3D do editor, mas não são arquivos executivos. No modelador, a conversão de PDF/imagem para paredes é assistida: a escala precisa ser calibrada e as sugestões revisadas; a vista 3D extruda a geometria confirmada, sem converter automaticamente todos os textos, símbolos ou detalhes da imagem.
- A tela de integração mostra se as configurações existem. Nenhum fornecedor, banco, serviço fiscal ou integração externa recebeu chamadas nesta demonstração.

Tornar esses módulos persistentes exige entidades e APIs próprias, validação de tenant/perfil e uma atualização do backend. Não reutilize rotas legadas bloqueadas para popular dados.

## Estado da carga adicional

O carregador agora prepara dados financeiros tenant-aware (orçamentos, títulos, baixas, extratos conciliados e pedidos internos) e solicitações fictícias de atendimento. Na revisão de 25/11/2026, as portas locais 3000, 3001, 8080 e 8081 não estavam em execução. A API isolada não pôde ser iniciada porque não há JDK 21 disponível nesta máquina; assim, os registros financeiros e de atendimento ainda não foram gravados nem conferidos. O carregador permanece pronto para ser retomado após disponibilizar o JDK 21 e iniciar a instância isolada. Nenhuma instância operacional ou banco foi alterado.

## Acesso

O login administrativo é `admin@horizonte-demo.test.invalid`. Para consultar credenciais da demonstração no próprio computador, use:

```powershell
node scripts/acessos-demonstracao.mjs
```

Esse comando consulta o arquivo local cifrado. Não publique senhas em documentação, mensagens ou capturas de tela. Contas internas criadas pelo RH precisam trocar a senha inicial no primeiro acesso.

## Conferência e retomada

```powershell
node scripts/demo-isolated.mjs --verificar
```

Para conferir e popular são usadas APIs da empresa e do banco isolados. A carga é retomável pelo arquivo `obra360-backend/data/demonstracao/empresa.json`; `--popular` não deve ser usado como rotina de reset. Para recriar a demonstração, faça backup e use o processo de provisionamento com a API da instância isolada parada.

O carregador valida o tenant e o ambiente antes de criar dados. Não copie a base operacional para apresentações. A demonstração serve para navegação e ensaios locais; não representa um aceite de cliente real.
