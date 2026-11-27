# Fechamento das lacunas do Obra360 — design

## Intenção

Levar a versão operacional do Obra360 a um estado consistente para piloto corporativo, priorizando persistência real, isolamento por empresa, autorização no servidor, integração honesta das telas e documentação que reflita o código executável.

## Estado encontrado

- `src/main.tsx` seleciona `Workspace` no modo operacional (`VITE_USE_MOCK=false`) e a interface antiga `App` no modo de demonstração com mocks.
- O backend Spring e as migrações SQL já sustentam cadastros e processos de várias áreas. Há endpoints reais para RH, compras, estoque, projetos, plantas, documentos, financeiro, publicação ao cliente, planilhas e mensageria.
- Algumas telas antigas não pertencem ao `Workspace` operacional e dependem de `INITIAL_*`, `localStorage` ou respostas simuladas. Não devem ser descritas como CRUD persistente.
- Existem integrações em que há tela/rota mas não existe conta, certificado, provedor ou destino externo configurado. O código não deve declarar sucesso externo sem confirmação do provedor.
- Produção requer um host, domínio, segredos e responsáveis que não estão nesta cópia. O trabalho local pode preparar e validar o pacote, mas não publicar por conta própria.

## Metas

1. Inventariar as rotas da interface operacional por entidade e por operação CRUD/workflow; corrigir lacunas alcançáveis com as APIs e regras atuais.
2. Revisar endpoints preexistentes de chat e marketplace B2B para garantir autenticação, identidade derivada da sessão e filtragem tenant-aware antes de conectá-los a uma tela operacional.
3. Para cada módulo cuja API ou modelo SQL não existe, adicionar entidade/migração, validação, serviço, autorização, tela/API e documentação, um módulo por entrega revisável.
4. Registrar integrações externas como indisponíveis até que configuração privada e uma resposta real validem a integração; nunca fabricar confirmação fiscal, compra ou mensagem enviada.
5. Manter `Workspace` como produto operacional e `App`/`VITE_USE_MOCK=true` como protótipo demonstrativo claramente identificado.
6. Preparar e verificar release, implantação e backup localmente, sem alegar produção ativa nem tocar em servidores/bancos externos.

## Fora de escopo sem dados externos

- Provisionar domínio, enviar tráfego público, criar credenciais de provedores, transmitir NF-e ou fazer pedido a fornecedores reais.
- Cálculo fiscal/trabalhista oficial, eSocial, certificação técnica de BIM ou aceite de empresa piloto.
- Inventar política comercial de autoatendimento ou cobrança SaaS. Provisionamento de empresa permanece ação administrativa até definição e validação desse fluxo.

## Abordagens consideradas

1. **Remover todas as telas antigas de demonstração:** mais rápido, mas perde referências visuais e ferramentas que podem ser reaproveitadas; rejeitada como estratégia geral.
2. **Conectar cada tela antiga diretamente aos endpoints com mesmo nome:** rápida, porém algumas rotas aceitam identidade enviada pelo cliente ou têm escopo inseguro; rejeitada por risco de acesso cruzado entre empresas.
3. **Fechar a interface operacional sobre APIs seguras, revisar autorização/tenant na origem e migrar os módulos ausentes por fatias:** adotada por preservar processos já funcionais e impedir que os mocks ou endpoints inseguros virem produto por acidente.

## Decisão de execução

Trabalhar em fatias. Primeiro produzir uma matriz de cobertura e bloquear/internamente encapsular rotas de chat/marketplace que não derivem empresa/usuário autenticados. Em seguida fechar um módulo persistente por vez, começando pelo que já tem entidade e operações no backend. Documentar integrações e impedimentos em cada fatia. Não alterar banco de demonstração ou operacional em execução; migrações novas só serão aplicadas no próximo start/release autorizado.

## Critérios de sucesso

- Nenhuma tela da interface operacional apresenta gravação local como gravação no banco.
- Cada ação oferecida na interface tem rota autenticada, validação, autorização no servidor e escopo de empresa; registros reaparecem após novo login/leitura da API.
- Rotas B2B/chat não confiam em `empresaId`, `usuarioId` ou papel arbitrário enviado no corpo/query.
- A documentação lista o que persiste, o que é workflow, o que é simulação e o que exige provedor/infraestrutura.
- Build/typecheck e os checks de execução autorizados passam; testes automatizados não serão criados/executados sem solicitação explícita.
- Produção continua identificada como pendente até haver evidências reais de host, domínio, segredos, restauração e aceite do piloto.
