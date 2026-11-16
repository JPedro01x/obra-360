# Orçamento, financeiro e pedidos de materiais

Atualização de 15/11/2026. Funcionalidades administrativas locais. Não executam transferências bancárias, emissão fiscal, cálculos legais de folha ou envio ao eSocial.

## Orçamento e financeiro

Abra **Orçamento e financeiro** e selecione uma obra pelo nome. As abas permitem:

1. Criar uma revisão de orçamento com valor e justificativa. Super Admin, gerente e incorporador podem aprovar. A aprovação substitui a revisão vigente e preserva a anterior no histórico.
2. Cadastrar contas a pagar e receber, com categoria, contraparte, descrição e vencimento. Super Admin e Financeiro podem movimentar títulos. Gerência, incorporador e auditor podem consultar.
3. Registrar baixas parciais ou integrais de pagamentos/recebimentos já ocorridos, com data efetiva, conta e comprovante/observação. Repetir a mesma chave e conteúdo não duplica a baixa. A API rejeita valor superior ao saldo e data efetiva futura.
4. Estornar uma baixa com justificativa, preservando original e estorno. Uma baixa conciliada exige desfazer a conciliação antes do estorno. Títulos manuais sem saldo baixado podem ser cancelados; contas originadas de pedidos são controladas pelo pedido.
5. Importar extrato em CSV, até 500 movimentos e 1 MB por envio. Use o cabeçalho `identificador;data;descricao;valor`, datas `AAAA-MM-DD`, valores sem milhares e sinal negativo para saídas. O identificador deve ser estável e único por conta. Reimportar conteúdo igual não duplica; conteúdo divergente com o mesmo identificador é rejeitado.
6. Conciliar manualmente o movimento com a baixa correspondente. Obra, conta, sinal e valor devem coincidir. Não é uma conexão automática ao banco.

Os indicadores distinguem investimento aprovado, despesas comprometidas, créditos por devolução, compromissos líquidos, pagamentos, recebimentos e saldos. O saldo do orçamento considera despesas comprometidas menos créditos de devolução. Compras, contratos, consumo e títulos não são somados indiscriminadamente.

**Importante:** registros anteriores de contratos, compras unitárias e folha não são convertidos automaticamente em títulos. Confira os saldos de abertura e cadastre somente obrigações/receitas ausentes, com referência à fonte, evitando duplicidade. Baixa administrativa não comprova por si só a movimentação no banco. A conciliação e a classificação precisam de conferência humana.

## Pedidos de materiais

O fluxo anterior de requisições e cotações continua disponível. O novo módulo **Pedidos de materiais** aceita até 100 materiais da mesma obra por pedido, sem repetições, com quantidades e preços por item, fornecedor, referência da proposta comercial e justificativa.

1. Crie o pedido com os preços da proposta conferida. Não há envio automático ao fornecedor.
2. Obtenha aprovação de gestão e financeiro por duas pessoas distintas. Uma pessoa não pode preencher as duas alçadas.
3. Emita o pedido. A emissão gera uma conta a pagar pelo total, sem entrada de estoque e sem pagamento automático.
4. Super Admin, gerente ou almoxarife registram entregas parciais ou integrais, somente dos itens realmente entregues. A API rejeita excesso, item de outra obra/pedido e alterações concorrentes. Cada entrega atualiza saldo e custo médio. Um lote é atômico: falha em um item reverte todos os itens da entrega.
5. Registre devolução de material recebido e disponível em estoque. Gera saída ao custo médio vigente e crédito a receber do fornecedor ao preço do pedido. Esses valores podem diferir. O crédito não elimina a conta original nem comprova reembolso; confira a compensação ou o recebimento com o financeiro. Reposição de material devolvido exige novo pedido.

Pedidos movimentados não são apagados nem cancelados. Antes de entrega, o cancelamento preserva o histórico e cancela a conta vinculada somente se não houver baixas. As requisições de repetição usam chave de idempotência e controle de versão. A emissão e o recebimento não substituem NF-e nem escrituração contábil.

## RH e contabilidade

Em **Recursos humanos → Contabilidade e obrigações**, consulte os pré-requisitos e exporte os lançamentos de uma folha fechada ou paga para a contabilidade. O CSV privado contém matrícula, nome, competência, rubrica, natureza e valor, com proteção contra fórmulas em campos de texto. Até 10 mil lançamentos por arquivo. Essa exportação não é XML do eSocial e não transmite eventos.

Cálculos legais, rescisão automática e envio ao eSocial ficam desativados conforme a decisão do responsável, que ainda não tem contador/certificado/provedores. Antes de implementar e ativar esses fluxos, são necessários regras da competência, incidências, convenção, leiautes e homologação com profissional responsável. Google, e-mail, IA e SEFAZ permanecem opcionais e dependentes de configuração privada e validação real; não são ativados por esta atualização.

## Plantas

Após importar PDF/imagem e calibrar uma distância conhecida, **Sugerir paredes da planta** identifica alguns traços sólidos, horizontais e verticais. Uma prévia permite escolher quais paredes adicionar ao rascunho. A análise ocorre no navegador, sem envio a um provedor de IA. Nada é gravado automaticamente: conferir geometria e usar **Salvar modelo** continua necessário. Não reconhece de forma confiável portas, janelas, texto, desenhos inclinados ou qualquer planta arbitrária. O traçado manual permanece disponível.

## Exportação, quota e retenção

- Exportação imediata: até 25 MB descompactados e 10 mil registros.
- Exportação em segundo plano, em **Conta e atendimento**: até 250 MB descompactados e 100 mil registros; senha do Super Admin para solicitar, uma ativa por empresa, um processamento e quatro vagas de fila por servidor. O ZIP é privado, restrito à empresa e disponível por 24 horas. Reinício marca trabalhos interrompidos como falha; não há retomada distribuída.
- Arquivos temporários expirados são limpos periodicamente, em lotes limitados. Downloads são autenticados e auditados. Exportação não é backup restaurável.
- `DOCUMENT_STORAGE_MAX_BYTES`: quota global do armazenamento local, padrão 10 GiB, incluindo documentos, RH e ZIPs temporários. A exportação assíncrona reserva conservadoramente 300 MiB. Não é uma quota individual de cada empresa. A instalação pressupõe um único processo da API escrevendo nesse diretório.
- Limpeza de credenciais expiradas: perfil de operador com `OP_ACTION=limpar-expirados`, `OP_COMPANY_ID` e `OP_RETENTION_DAYS` (90 por padrão, mínimo 30). **Simula por padrão**; somente `OP_APPLY=true` executa. Até mil sessões, convites e tokens de recuperação por tipo e execução, expirados há mais que o período. Não apaga usuários, auditoria, cadastros, documentos ou registros financeiros. Essa política técnica não substitui uma política legal de retenção de dados pessoais.

Antes de executar manutenção, faça backup e confira o destino da conexão. O comando do operador exige `spring.main.web-application-type=none`. Não informe senhas em argumentos públicos nem publique o arquivo de ambiente.
