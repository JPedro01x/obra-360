# Auditoria dos perfis

`npm run test:roles` usa API 8081 e banco H2 em memória próprios. Não executa alterações na instalação local da porta 8080. Cria quinze contas de teste, uma obra e vínculos externos. Percorre as páginas permitidas, abre formulários e suas opções, exercita pesquisa, atualização, modos 2D/3D, propostas, reserva, chamados, atendimento, responsividade e encerramento de sessão. Captura erros HTTP e JavaScript e anexa cobertura e imagem por perfil.

Inclui leitura real de IFC e documentos, além de uma matriz de 315 verificações da API: treze cadastros, seis alterações, envio e download de arquivo para cada um dos quinze perfis.

A jornada `npm run test:integrated` cobre gravações completas de estoque, ordens, documentos, RH, folha manual, histórico, plantas, impressão, convites e exportação. `npm test` verifica estados, validações, geometria, IFC e paginação. Maven verifica regras e concorrência; `npm run test:postgres` repete os cenários de integração no PostgreSQL isolado. Esses comandos não provam todas as combinações possíveis de entradas ou o funcionamento de provedores externos sem credenciais.

Execute testes de navegador isoladamente para evitar esgotar os recursos da máquina. As rotinas da instalação local respeitam o limite de requisições por IP; não as execute junto a baterias de login em sequência.
