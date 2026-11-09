# Revisão técnica — Obra360

Data: 6 de novembro de 2026.

Resultado atual da revisão visual e funcional: 66 testes Java, 49 cenários em PostgreSQL, 23 testes de interface, quinze jornadas por perfil, matriz com 315 verificações de API e jornada completa de operação aprovados. Foi corrigido o erro interno por conflito de nome de modelo após importação. O escopo, as evidências e as integrações que ainda precisam de configuração estão em [VALIDACAO-FUNCIONAL.md](VALIDACAO-FUNCIONAL.md). Os números de etapas anteriores abaixo são registros históricos.

## Atualização de preparação comercial

Foram acrescentados sessões revogáveis no banco, MFA TOTP com segredo criptografado e códigos de recuperação, convites de uso único, limites de usuários/obras/modelos, provisionamento de empresas por comando do operador, exportação privada e atendimento de suporte/privacidade. Contratos, cobrança automática, quotas de armazenamento/IA, aceite com cliente real e auditoria independente não estão concluídos. Escopo e procedimento de piloto em [COMERCIALIZACAO.md](COMERCIALIZACAO.md).

Validação adicional: 47 cenários de segurança/fluxos passaram em H2 e em PostgreSQL real isolado com migrações V1–V19; vetor TOTP de referência validado; 21 testes de interface e jornada integrada completa com atendimento, ZIP, convite e revogação passaram. O provisionamento por CLI foi executado em banco isolado em memória. Nenhuma dessas execuções representa homologação por um cliente real.

## Escopo e origem dos dados

Foram examinados os fontes React/TypeScript, serviços de integração, controladores e serviços Java, entidades, migrações, configuração, exportadores, infraestrutura local e testes. Arquivos gerados não são tratados como fonte da aplicação. O repositório continha definição de schema e exemplos em memória; não foi encontrada uma base operacional com cadastros reais disponível nesta instalação.

Os dados reais devem ser os registros que o usuário cadastrar ou importar para o banco. Nomes de pessoas, contatos, preços, indicadores de obras e situação fiscal não podem ser obtidos de uma fonte pública genérica para substituir registros de uma operação específica.

## Achados e medidas

| Achado | Medida aplicada |
| --- | --- |
| Login inválido devolvia usuário SUPER_ADMIN | Removido fallback; senha BCrypt e conta ativa exigidas; falhas retornam 401 |
| Token era texto fabricado | JWT assinado, com emissor e validade; usuário revalidado a cada requisição |
| APIs estavam liberadas com permitAll | Rotas seguras explicitamente autorizadas; endpoints históricos bloqueados |
| Empresa determinada por cabeçalho arbitrário ou tenant 1 | Empresa obtida do usuário autenticado; tentativa de trocar tenant é rejeitada |
| Consultas findAll vazavam registros entre empresas | Novo contrato de consultas com filtro de empresa e relacionamentos com a obra |
| Senha/hash retornado no JSON de entidade | Campo somente para escrita; resposta não contém hash |
| Cadastro de usuário aceitava identidade e empresa do cliente | ID gerado pelo banco; empresa fixada pelo servidor; cadastro restrito ao administrador |
| Frontend entrava automaticamente como administrador | Modo real exige login ou configuração inicial de base vazia |
| Falhas de rede retornavam dados e sucessos fictícios | Erro explícito; sem substituição automática por demonstração |
| Base local em memória perdia tudo ao reiniciar | Perfil local em arquivo, separado do perfil de teste em memória |
| Tela dependia de schema diferente dos retornos Java | Interface real usa os campos do banco e contratos específicos da API |
| Serviços anunciavam SEFAZ/S3/IFC sem implementação | Bloqueados no modo real; exemplos disponíveis apenas em demonstração explícita |
| Cache de service worker escondia falhas e prendia builds antigos | Worker legado aposentado; não há cache de respostas autenticadas |
| Build do backend incluía bundles antigos | Recursos estáticos históricos excluídos do empacotamento e da localização de recursos ativos |
| Playwright chamava cmd no CI Linux | Comandos portáveis e configuração separada para a suíte histórica |
| Dependências de desenvolvimento vulneráveis | Vite/plugin React atualizados e correção transitiva aplicada via npm audit |
| CSV podia executar fórmulas ao abrir em planilhas | Células de texto neutralizadas e aspas escapadas |
| Exportações HTML interpolavam texto sem escape | Valores textuais escapados antes de gerar HTML |
| Relatório mostrava orçamento fixo e selo de auditoria | Valor não informado exibido como ausente; afirmação de auditoria removida |
| Falha interna expunha mensagem técnica | Resposta genérica; validação e conflitos têm status apropriados |

## Interface real

Layout responsivo com navegação por módulos, busca na página, paginação, atualização explícita e identificação da empresa/usuário. Formulários validam dados obrigatórios e datas. Telas vazias e falhas não apresentam indicadores inventados. Modais possuem identificação acessível, contenção de foco e fechamento por Escape.

## Situação atual e limites

IFC real, portais externos e recuperação SMTP foram implementados. S3, IA, Google e consulta SEFAZ têm conectores e testes locais; não houve autenticação com contas reais desses provedores. Consulte [INTEGRACOES.md](INTEGRACOES.md) para ativação e escopo.

Validação de etapa anterior: 57 testes Java aprovados na suíte padrão, 41 testes adicionais em PostgreSQL real UTF-8 isolado, migrações V1–V14 aplicadas, 21 testes de interface e jornada completa navegador/API/banco/SMTP local/portal aprovados. Os testes não usam a base operacional. Build TypeScript/Vite aprovado.

A auditoria relacional é parcial e não imutável. Rate limiting e proteção contra força bruta usam memória; múltiplas instâncias precisam de coordenação. Não há antivírus de anexos, convite por e-mail, renovação automática de token ou revogação de uma única sessão. A alteração de credenciais invalida todas as sessões anteriores.

O perfil local usa H2 persistente e atualização de schema. Produção usa PostgreSQL com Flyway; mudar o perfil não transfere os dados. A V3 histórica foi corrigida de ordem_servico para solicitacao_servico: instalações externas com histórico divergente exigem análise antes de atualizar, sem repair automático.

Não houve deploy público, build Docker ou certificação fiscal/LGPD/ISO. Antes da publicação, valide infraestrutura, dependências Maven, HTTPS, backups e conexão real de cada provedor. Fornecedores legados sem empresa exigem verificação manual de origem. A demonstração legada continua isolada. Foi criada, a pedido, uma base persistida de homologação identificada como dados de teste; ela não representa operação empresarial real.

Módulo de RH implementado e validado com migração V11, permissões específicas e fluxo no navegador. Escopo operacional e limitações da folha estão em [RH.md](RH.md).

Dossiê privado de RH e histórico funcional adicionados com a V12. Testes verificam isolamento, preservação de versões, integridade de arquivos, valores salariais anteriores/novos e ausência de CPF/contatos nos snapshots.

Modelador real 2D/3D adicionado com migração V13, pavimentos e aberturas paramétricas simples, revisões e validação por empresa/perfil. A demonstração 3D legada permanece isolada. Veja [MODELADOR.md](MODELADOR.md).

A migração V14 identifica o ambiente de dados. Há diagnóstico estrutural por empresa e base persistida de homologação com credenciais locais geradas. A veracidade factual e o aceite humano permanecem pendentes; veja [HOMOLOGACAO.md](HOMOLOGACAO.md).
