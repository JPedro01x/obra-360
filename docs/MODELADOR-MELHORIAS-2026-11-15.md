# Melhorias do modelador — 15/11/2026

Entrega dos três pontos prioritários: reconhecimento assistido, manipulação diretamente no 3D e conferência da geometria. As estruturas persistidas continuam compatíveis com os formatos 1 e 2; não houve migração nem edição em massa dos modelos cadastrados.

## Usar os novos recursos

1. Abra uma obra e seu modelo em **Modelador 2D/3D**.
2. Para desenhar a partir de imagem/PDF, carregue a referência, calibre uma medida conhecida e clique em **Sugerir paredes da planta**. Confira as sugestões. Se houver **Possíveis vãos**, a escolha inicial é não criar abertura; só classifique como porta/janela depois de conferir.
3. Adicione as sugestões ao rascunho. Um vão aceito une os dois trechos selecionados e cria uma abertura vinculada. Confira espessura, altura e peitoril no painel.
4. Selecione um elemento e use **Mover 3D**, **Girar 3D** ou **Dimensionar 3D**. Arraste o eixo e solte para confirmar a alteração local. Esc cancela; Desfazer/Refazer percorre as alterações. A manipulação é de um elemento por vez.
5. Clique em **Verificar geometria**. Inspecione os apontamentos e repita a análise depois de editar. Eles não alteram o desenho nem impedem salvar interseções intencionais.
6. Use **Salvar modelo** para persistir a revisão. Analisar uma referência, aceitar sugestões ou manipular a prévia não substitui esse salvamento.

## Comportamento e limites

- Paredes inclinadas: reconhecimento conservador de componentes sólidos, com escala física considerada nos dois eixos. Textos, hachuras, traços duplos sem preenchimento, curvas e fotos em perspectiva podem exigir traçado manual.
- Aberturas: candidatos são intervalos entre trechos alinhados de 0,50 a 2,20 m. A aplicação não interpreta o símbolo arquitetônico nem decide se o intervalo é porta, janela ou separação intencional. A classificação é humana e nenhum tipo é escolhido automaticamente. Um trecho participa de no máximo uma união na mesma aplicação.
- Processamento local: worker separado, cancelamento ao mudar o contexto e limite de 20 segundos; até 150 paredes sugeridas. Não depende de provedor de IA. Medidas adicionadas ao rascunho são arredondadas a quatro casas decimais em metros.
- Transformações: translação com a grade, rotação vertical em passos de 5° e escala em passos de 5%. Aberturas se movem no eixo local da parede; portas mantêm base zero. A parede acompanha seus nós conectados e suas aberturas. Dimensionar a parede preserva as medidas das aberturas, com rejeição se elas não couberem. A prévia é reconstruída e validada ao soltar.
- Conferência: caixas retangulares orientadas, intervalos verticais, extremidades livres e cotas. Não desconta vãos nem substitui verificação estrutural/normativa. Junções usuais em L/T e contatos de lajes nas bases/topos são tratados separadamente. Resultados limitados a 100 apontamentos e aproximadamente 250 mil comparações, com aviso se a análise ficar incompleta.
- Visualização: renderização sob demanda. Se WebGL perder o contexto, os controles 3D são desativados e o documento continua editável em 2D. O usuário pode salvar e recarregar a vista.
- Permissões: ferramentas de transformação seguem os perfis já autorizados e o bloqueio de modelos arquivados. Consultar e inspecionar não concede permissão para gravar.

Estas mudanças não transformam o editor em um sistema completo de autoria BIM. Telhados/escadas, intercâmbio completo IFC/GLB, materiais avançados e cronograma de execução ligado ao modelo continuam evoluções próprias. O timelapse existente continua mostrando revisões salvas.

## Evidências técnicas

| Verificação | Resultado |
| --- | --- |
| TypeScript | Sem erros |
| Suíte completa de interface | 87 testes aprovados |
| Arraste real em WebGL | Translação e dimensionamento, Desfazer/Refazer e cancelamento por Esc aprovados |
| Aberturas | Classificação explícita, remoção de escolha ao desmarcar parede, preservação de medidas e rejeição de dimensões inválidas |
| Geometria | Interferências inclinadas, junções L/T, pavimentos separados, cotas sobrepostas, análise limitada e ausência de mutação do desenho |
| Permissões e falha gráfica | Perfil de consulta sem ferramentas e perda de WebGL com continuidade em 2D |
| Jornada integrada | Arraste no 3D, salvamento pela API e conferência de coordenadas; referências, revisões e publicação preservadas |

Logs locais: `scratch/modelador-regressao-final.log`, `scratch/modelador-conferencia-final.log`, `scratch/modelador-controles-final.log`, `scratch/modelador-integrado-real.log`, `scratch/modelador-integrado-final.log`, `scratch/modelador-types-final.log` e `scratch/modelador-diagnostico.log`.

A captura `test-results/integrated/operational-flow-complete--ad58a-gh-browser-API-and-database-chromium/edicao-3d-real.png` foi inspecionada visualmente. Os testes usam dados sintéticos e bancos isolados; não certificam qualquer planta, dispositivo, volume de modelo ou adequação técnica de um projeto de engenharia. O detalhamento de operação continua em [MODELADOR](MODELADOR.md).
