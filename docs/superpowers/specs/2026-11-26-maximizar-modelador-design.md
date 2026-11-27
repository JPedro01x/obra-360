# Maximizar o espaço de trabalho do Modelador

## Intenção

Dar mais área à visualização e edição de plantas 2D/3D em telas desktop, sem retirar as ferramentas e o inspetor usados durante a edição.

## Abordagem

Um botão alterna o conjunto de controles, ferramentas, viewport e inspetor do Modelador para uma camada fixa que ocupa a área visível do aplicativo. O botão muda para “Restaurar”; Esc também fecha a camada. O estado do modelo permanece na tela e não é salvo automaticamente.

## Alternativas consideradas

- Fullscreen nativo do navegador: ocupa a tela, mas transfere o controle para a interface do navegador e tem suporte variável.
- Aumentar apenas a altura do canvas: preserva o layout, mas continua limitado pela navegação, topo da página e painéis ao redor.
- **Camada maximizada no viewport do aplicativo (escolhida):** amplia o espaço de edição e mantém os controles necessários; Esc e botão devolvem o layout normal.

## Limites

- A função vale para a área do Modelador com um modelo aberto, inclusive em perfis somente leitura; os controles de edição continuam sujeitos às permissões atuais.
- A maximização não publica, salva nem modifica a geometria.
- Manter o layout original após restaurar, prender foco na área maximizada e respeitar os limites de edição já existentes.

## Verificação

Executar typecheck e build; não adicionar nem executar testes automatizados.
