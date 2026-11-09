# Operação local

## Percurso de uma obra

1. Execute `npm run dev`. No primeiro acesso, informe os dados reais da empresa e do administrador.
2. Em **Usuários**, cadastre um engenheiro ou gerente de obra. O administrador pode editar contas, desativar acesso e redefinir senhas. Alterar dados de uma conta invalida seus tokens anteriores. Não é permitido remover o próprio acesso administrativo.
3. Em **Empreendimentos**, cadastre a obra e selecione o responsável. A ação **Editar empreendimento** permite corrigir o cadastro.
4. Em **Fornecedores**, registre o fornecedor. Um cadastro novo fica **EM ANALISE**, sem selo de homologação inventado. O CNPJ é registrado, sem consulta à Receita.
5. Em **Contratos**, vincule fornecedor e obra e informe os valores e datas.
6. Em **Equipes**, cadastre a equipe da obra e o líder ativo da empresa.
7. Em **Almoxarifado**, cadastre o material da obra, sua unidade, estoque mínimo e custo unitário de referência. O saldo inicial é zero. Use **Movimentar estoque → ENTRADA** para registrar a quantidade recebida. O saldo só muda por movimentação; editar o material não altera quantidades já registradas.
8. Em **Ordens de serviço**, selecione contrato e equipe da mesma obra e informe o serviço, a prioridade e o prazo.
9. Na ordem, use **Registrar consumo**. O material deve pertencer à mesma obra. O sistema grava a saída, o consumo, o custo e a auditoria juntos. Saldo insuficiente ou ordem encerrada bloqueia a operação. Uma repetição com o mesmo identificador não duplica o consumo.
10. Use **Atualizar ordem** para passar de **ABERTO** para **EM ANDAMENTO** e depois **CONCLUIDO**. Cancelamento também é possível. Cancelar uma ordem não devolve materiais já consumidos; eventuais devoluções físicas devem ser registradas como entrada de estoque.

O resumo operacional é calculado pelos registros da empresa. O custo de consumo corresponde à quantidade multiplicada pelo custo unitário cadastrado no momento da baixa; não é uma consulta fiscal ou um cálculo automático de custo médio de compras.

## Outros módulos

- **Cronograma:** crie etapas com datas previstas e informe o percentual de execução entre 0 e 100.
- **Qualidade e segurança:** registre ocorrências e atualize o plano de ação.
- **Unidades imobiliárias:** cadastre as unidades e atualize sua disponibilidade. Uma alteração feita sobre situação desatualizada é rejeitada para evitar sobrescrever outra operação. Isso não substitui um contrato jurídico de venda nem uma integração de cobrança.
- **Cotações:** registre propostas de fornecedores e prazos informados.
- **Pós-venda:** abra chamados vinculados a unidades e acompanhe o atendimento. O portal externo do proprietário ainda não está implementado.
- **Movimentações** e **Consumo por ordem:** consulte o histórico efetivo dos materiais.
- **Auditoria:** consulte os eventos persistidos das operações novas. A tabela não constitui armazenamento imutável.

## Documentos

Em **Documentos**, envie um arquivo de até 20 MB vinculado à obra. A API armazena o conteúdo em arquivo local com identificador aleatório e registra seu SHA-256. O nome recebido não determina o caminho de armazenamento.

Use **Enviar nova versão** para preservar as anteriores. **Baixar arquivo** exige acesso autorizado à empresa. Os arquivos são entregues como anexos, não como conteúdo executável na interface. Um arquivo histórico que não esteja no armazenamento local será mostrado como indisponível para download. O Leitor IFC interpreta quantitativos declarados no arquivo separadamente. Não há análise antivírus dos documentos.

## Acesso e senhas

**Minha senha** exige a senha atual e desconecta as sessões anteriores após a alteração. A nova senha deve ter pelo menos 12 caracteres e no máximo 72 bytes, conforme o limite do BCrypt. A desativação de uma conta bloqueia as próximas requisições de suas sessões. O administrador pode redefinir a senha de outro usuário; há recuperação pública quando SMTP estiver configurado; veja [INTEGRACOES.md](INTEGRACOES.md).

## Backup e restauração

Os comandos abaixo são para o banco H2 local padrão. Encerre a aplicação com Ctrl+C antes de executá-los. Não use esses comandos para PostgreSQL. Backups contêm dados e documentos da empresa: mantenha-os em armazenamento privado e copie-os também para outro dispositivo.

```powershell
npm run backup
```

O backup inclui a pasta `data` completa e um manifesto com SHA-256 dos arquivos. O identificador aparece no terminal e corresponde à pasta em `backups`.

Para restaurar uma cópia escolhida:

```powershell
npm run backup:restore -- IDENTIFICADOR --confirm
```

Os hashes são conferidos antes da substituição. A base atual é preservada em `obra360-backend/data-before-restore-*`. O comando recusa operação enquanto encontra o servidor local padrão na porta 8080. Se você executar a API em outra porta, também precisa encerrá-la antes. A cópia não é criptografada nem assinada; o manifesto detecta corrupção, mas não prova autenticidade contra quem possa alterar também o manifesto.

## Preparação para publicação

Há um Dockerfile na raiz que prepara a interface e a API no mesmo serviço, com execução por usuário sem privilégios. Ele requer PostgreSQL, `JWT_SECRET`, senha do banco e volume persistente em `/app/data` para documentos. Configure HTTPS no proxy de entrada. A configuração inicial pública fica desabilitada por padrão em produção.

`/actuator/health/liveness` indica vida da aplicação; `/actuator/health/readiness` inclui disponibilidade do banco. As respostas da API recebem `X-Request-ID`, e o log registra método, caminho, status e duração, sem copiar senhas ou corpos de requisição.

O Dockerfile e a publicação em PostgreSQL precisam ser validados no ambiente de destino. Não foi realizado deploy público. Revise as dependências Maven, retenção de arquivos, limites operacionais, backups PostgreSQL e recuperação de acesso antes dessa etapa.
