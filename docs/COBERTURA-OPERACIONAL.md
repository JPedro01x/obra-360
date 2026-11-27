# Cobertura operacional do Workspace

Atualizado em 26/11/2026. Este mapa descreve a interface operacional `Workspace` e os endpoints sob `/api/v1/workspace` e `/api/v1/portal`. `src/main.tsx` só monta o `App.tsx` legado quando `VITE_USE_MOCK=true`; os serviços com dados locais são usados por essa demonstração, não pela interface operacional. `npm run start:demo` define `VITE_USE_MOCK=false` e executa `Workspace` com API e H2 isolados nas portas 3001/8081. `npm run dev:demo` carrega `.env.demo`, habilita mocks e mostra a faixa de demonstração.

## Registros paginados

Os 19 recursos abaixo têm leitura paginada no banco pelo endpoint `GET /api/v1/workspace/registros/{resource}`. Empresa/perfil vêm da sessão; filtros de projeto e entidade são aplicados no servidor.

| Recurso | Entrada/criação e alterações disponíveis na interface | Exclusão e regra de histórico |
| --- | --- | --- |
| Coberturas | Cadastro e edição por formulário; valida período, tenant e categoria única por unidade; workflow de avaliação da garantia | Não há exclusão física para manter referências dos chamados; desativação preserva o histórico |
| Acessos externos | Concessão pelo administrador | Revogação do vínculo; não apaga a conta convidada |
| Fornecedores | Cadastro por empresa; edição de razão social/categoria; propostas e contratos | CNPJ é imutável como identificador; exclusão somente sem vínculos; unicidade por empresa |
| Movimentações | Entrada/saída/consumo como lançamento auditado | A tabela não oferece edição/exclusão; procedimento de estorno precisa de revisão antes de usar lançamento compensatório |
| Consumo por ordem | Criado como movimentação de consumo vinculada à OS | Ledger de consumo; sem edição isolada |
| Usuários | RH cria conta interna; convite cria conta externa com aceite | Desativação/revogação pela administração; cadastro não é criado por formulário genérico |
| Empreendimentos | Criação e edição dedicadas; limite da licença validado | Exclusão somente quando não houver vínculos |
| Almoxarifado | Cadastro, edição e movimentações | Exclusão confirmada só se o saldo for zero e não houver compras, consumo ou movimentações; caso contrário, mantém o histórico |
| Documentos | Upload e nova versão; download por rota autorizada | Versões vinculadas ao histórico do projeto |
| Cronograma | Cadastro; edição de nome, ordem e datas antes do primeiro avanço/medição; avanço monotônico | Ordem única por empreendimento; percentual não regride; etapas com medição/avanço ficam bloqueadas para edição |
| Qualidade e segurança | Ocorrência, evidência e atualização do plano de ação | Evidências seguem o ciclo da ocorrência |
| Equipes | Cadastro; nome, especialidade e quantidade podem ser editados antes da primeira OS | Após vínculo com OS, edição é bloqueada para preservar histórico; exclusão só sem vínculos |
| Ordens de serviço | Abertura, status, consumo, justificativa e aprovação de encerramento atrasado | Encerramento/cancelamento substitui exclusão física |
| Contratos | Cadastro e ativação/desativação | Desativação preserva OS e histórico financeiro |
| Cotações | Proposta interna ou enviada pelo portal do fornecedor | Propostas vinculadas à requisição; seleção/rejeição preserva o registro |
| Requisições e pedidos | Requisição, cotação, seleção, duas aprovações distintas, pedido interno, recebimento ou cancelamento | Estados e eventos mantêm trilha do processo; o botão informa que não transmite a ordem a outro software |
| Unidades imobiliárias | Cadastro e mudança de disponibilidade/reserva | Status e vínculos persistem para pós-venda/relacionamento |
| Pós-venda | Cliente abre chamado; equipe agenda vistoria, avalia cobertura e gera OS | Conclusão encerra o chamado sem apagar o histórico |
| Auditoria | Consulta de eventos | Somente leitura; eventos não são editáveis pela tela |

O formulário genérico de criação atende 15 recursos. Quatro exceções usam fluxos específicos: **empreendimentos** (formulário dedicado), **usuários** (RH/convites), **consumo** (lançamento de estoque vinculado à OS) e **auditoria** (somente leitura). Recursos com saldo, aprovação, evidência ou obrigações relacionadas não devem receber exclusão física genérica.

## Módulos em telas próprias

- **Mensagens da equipe:** chat interno persistido e separado por empresa; participante e empresa vêm da sessão. A migração V35 precisa ser aplicada ao banco pela próxima inicialização autorizada.
- **Configuração inicial da obra:** depois do cadastro dos dados básicos, o assistente resume pessoas alocadas no RH, equipes, materiais, etapas do cronograma, modelos 2D com elementos salvos e acessos de clientes por unidade. O estado é consultado no banco e a obra pode ser retomada pela lista de empreendimentos. Funcionários já alocados a outra obra não são transferidos automaticamente; cada vínculo funcional gera histórico e auditoria. A criação do modelo vazio não conclui a etapa de planta; material cadastrado inicia com saldo zero. V41 adiciona somente a persistência das dispensas justificadas; a migration ainda não foi aplicada ao banco ativo.
- **Medições físico-financeiras:** registros por etapa/competência, aprovação da engenharia, liberação interna pelo financeiro, evidências PDF/PNG/JPEG e histórico. Anexos ficam no armazenamento privado; conteúdo, MIME e extensão são conferidos, o hash SHA-256 é verificado no download, o acesso é limitado à empresa e o limite é 20 arquivos de até 20 MB por medição. V36 cria medições e V40 cria anexos; liberação não executa pagamento bancário. As migrations ainda não foram aplicadas nesta revisão.
- **Mensageria operacional:** Kafka processa notificações de criação de OS quando `MESSAGING_ENABLED=true` e o broker responde. O padrão é desligado; nesse estado, a outbox SQL retém os eventos e o painel sinaliza pendência. Ativar exige configuração do broker e reinicialização autorizada da API; os demais módulos não são automaticamente publicados no Kafka.
- **RH e colaboradores:** áreas próprias de cadastro e autosserviço, com perfis e campos específicos; não são CRUD genérico de usuário.
- **Financeiro e pedidos de materiais:** fluxos especializados no banco. “Emitir pedido” no processo interno não significa enviar a ordem para ERP/loja externo.
- **Notas fiscais:** o Workspace registra manualmente a chave, número, fornecedor e itens, com unicidade por empresa e trilha de eventos. A nota fica pendente; um perfil autorizado pode lançar a entrada, que atualiza os saldos e as movimentações numa transação. Isso não importa XML nem prova autorização fiscal. A consulta de protocolo SEFAZ continua separada e depende de certificado/ambiente configurados. O esquema PostgreSQL está na V39; a migration ainda não foi aplicada nem validada em banco isolado.
- **Modelador e IFC:** editor de plantas/modelos e leitor IFC em worker. No modelador, alterações ainda não salvas aparecem como rascunho local identificado; apenas **Salvar modelo** cria revisão no banco. Há opção separada para guardar o rascunho privado no servidor. IFC lê quantitativos declarados, com limites documentados; não é motor de orçamento nem modelagem automática completa.
- **Planilhas:** modelos/importação/exportação passam pelo backend para validação e persistência apenas para funcionários e empreendimentos. Os outros módulos não têm importação/exportação por planilha; usam seus formulários e fluxos próprios. Limites e validações estão em [GUIA-PLANILHAS-CADASTRO.md](GUIA-PLANILHAS-CADASTRO.md).
- **Integrações:** configuração indica disponibilidade, não homologação; IA, SMTP, Google e SEFAZ dependem dos serviços e credenciais descritos em [INTEGRACOES.md](INTEGRACOES.md). IA/SEFAZ exigem chave idempotente; estado SQL e hashes são retidos por 30 dias sem armazenar pergunta, resposta ou chave fiscal. A tabela fica disponível no H2 local via entidade e no PostgreSQL via V38.

## Limites conhecidos nesta revisão

- As listagens entregam projeções de campos por módulo em vez de serializar a entidade inteira; informações de autenticação e localizador/hash interno de documentos ficam fora das tabelas. Consulte [CONSULTA-DE-DETALHES.md](CONSULTA-DE-DETALHES.md).
- As rotas B2B legadas que aceitavam entidades enviadas pelo cliente permanecem explicitamente bloqueadas com `denyAll`; o fluxo permitido é o portal autenticado e tenant-aware.
- A API legada `/api/v1/cronograma/**` foi bloqueada com `denyAll`: ela não aplicava o escopo de empresa e aceitava alteração sem as regras atuais. O cronograma operacional deve usar `/api/v1/workspace/**`, que deriva empresa/projeto da sessão e preserva o histórico.
- O endpoint legado `/api/v1/estoque/**` foi bloqueado com `denyAll`: ele confiava no cabeçalho `X-Usuario-ID` para autoria de movimentação. Estoque e movimentos usam as rotas de Workspace, que derivam o usuário da sessão.
- Os controllers REST legados `/api/v1/projetos/**`, `/api/v1/contratos/**`, `/api/v1/gestao-campo/**`, `/api/v1/qualidade-seguranca/**` e `/api/v1/documentos/**` usam consultas sem escopo de empresa ou aceitam entidades JPA diretamente; foram bloqueados com `denyAll`. O contrato suportado é o Workspace persistente.
- O controller REST legado `/api/v1/empresas/**` também está bloqueado com `denyAll`: listar/criar empresas não é uma função do administrador de cliente. O provisionamento multiempresa ocorre pelo comando operacional restrito; cada empresa recebe seu próprio administrador inicial.
- A migração V37 substitui a unicidade global do CNPJ do fornecedor por unicidade `(empresa_id, cnpj)`. Fornecedores legados sem empresa continuam sem ser atribuídos automaticamente; a nova regra só passa a valer quando Flyway aplicar a migração na próxima inicialização autorizada.
- Os controladores existentes ainda acessam JPA diretamente em partes do Workspace. O caminho funcional não elimina a necessidade de evoluir a separação entre controller, serviço de aplicação e persistência.
- A cobertura desta tabela é estática e baseada nos formulários/controladores atuais. Não substitui teste de aceite por perfil, conferência de cada regra com a empresa ou auditoria independente.
- A configuração guiada da obra usa a migration V41. O código e a migration ficam preparados, mas o banco da instância em execução não foi alterado nem a API reiniciada.
- O pedido de compra fica dentro do Obra360. Para enviá-lo a um programa externo, faltam API/contrato do fornecedor, credenciais, ambiente de teste e homologação.
- A publicação real continua pendente de infraestrutura, credenciais, backup restaurado e aceite, conforme [OPERACAO-PRODUCAO.md](OPERACAO-PRODUCAO.md).
