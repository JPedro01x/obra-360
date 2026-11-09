# Modelador 2D/3D

O **Modelador 2D/3D** está no modo real, ligado à API e ao banco. Os modelos são independentes por obra e empresa. Nenhum projeto de exemplo é criado automaticamente, e a geometria demonstrativa legada não foi importada.

## Começar um projeto

1. Cadastre a obra em **Empreendimentos**, se ela ainda não existir.
2. Abra **Modelador 2D/3D**, busque e selecione a obra.
3. Clique em **Novo modelo**, informe um nome e crie um modelo vazio. O cadastro inicial inclui um pavimento Térreo vazio, na cota 0 m e com altura de 2,80 m, editáveis pelo usuário.
4. Adicione paredes, lajes e pilares pelos botões. **Desenhar parede** permite arrastar na planta para definir comprimento, posição e orientação com encaixe na grade.
5. Selecione uma parede para adicionar portas ou janelas. Ajuste as dimensões no painel de propriedades.
6. Informe o motivo da revisão e clique em **Salvar modelo**. Reabra o modelo para continuar em outro acesso.

Uma obra pode ter vários modelos, como alternativas de projeto. **Duplicar modelo salvo** cria uma cópia independente da última revisão persistida. Salve primeiro as alterações locais que deseja copiar. Para trabalhar em outra obra, selecione-a na lista e crie seus modelos.

## Traçar a partir de PDF ou imagem

Com o modelo aberto, expanda **Usar planta PDF ou imagem como referência**. Selecione um PDF, PNG, JPEG ou WebP de até 20 MB. Em PDFs com mais de uma folha, escolha a página que corresponde ao pavimento. Informe uma distância conhecida em metros, clique em **Calibrar escala** e marque na imagem os dois extremos dessa distância.

Arraste na planta sobre o eixo da primeira parede. O segmento vira uma parede editável e aparece na vista 3D. Use **Desenhar parede** para continuar o traçado e o painel de propriedades para ajustar espessuras, alturas e medidas. Portas, janelas e lajes podem ser acrescentadas depois. A identificação de paredes e aberturas é feita pelo usuário.

**Salvar modelo** registra um arquivo de referência por revisão, com o pavimento, a página e a escala aplicada. Outro usuário interno com acesso à obra pode reabrir a planta com a referência. No histórico, use **Mostrar referência desta revisão**. Substituir ou remover o arquivo muda a nova revisão. Restaurar uma revisão recupera também sua referência. O portal do cliente recebe a planta publicada sem acesso ao PDF ou à imagem de origem.

## Geometria e edição

As unidades são metros. O eixo Y é vertical; X/Z definem a planta. Cada pavimento possui nome, cota e altura. Cada elemento tem nome, cor, dimensões e base relativa ao pavimento. A rotação é em torno de Y, em graus.

| Elemento | Comportamento                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------- |
| Parede   | Paralelepípedo orientado, com largura/comprimento, espessura e altura; recortes reais para aberturas |
| Laje     | Placa retangular com largura, profundidade, altura e rotação                                         |
| Pilar    | Seção retangular, altura e rotação editáveis                                                         |
| Porta    | Vinculada à parede, com deslocamento no eixo local, largura e altura; inicia na base da parede       |
| Janela   | Vinculada à parede, com deslocamento local, largura, altura e peitoril/base                          |

Portas e janelas acompanham posição, rotação, base e pavimento da parede. Sua profundidade visual deriva da espessura da parede. O recorte remove efetivamente a área correspondente da geometria da parede; não é apenas uma marcação por cima do sólido. A porta representa um painel fechado e a janela um painel translúcido, sem ferragens ou folhas articuladas.

Aberturas precisam caber na parede e não podem se sobrepor. Excluir uma parede também exclui suas aberturas na edição local; **Desfazer** recupera o conjunto. Duplicar uma parede copia suas aberturas com novos identificadores. Não há detecção geral de colisões entre paredes, pilares e lajes.

Na planta, clique para selecionar, use Shift para seleção múltipla e arraste para mover. As posições usam o incremento de grade escolhido. No painel lateral, edite medidas, posição, rotação, nome e cor e clique em **Aplicar propriedades**. Mudar o pavimento de uma parede também transfere suas aberturas; a validação impede ultrapassar a altura do novo pavimento. A edição por arraste ocorre na planta; a vista 3D oferece seleção, órbita, deslocamento de câmera e zoom, sem gizmo de transformação.

**Desfazer/Refazer** e Ctrl+Z/Ctrl+Y mantêm até 50 estados da geometria enquanto o modelo está aberto. O estado atual da geometria fica guardado como rascunho neste navegador, por conta, empresa e modelo. Ao reabrir, escolha **Recuperar rascunho** ou descarte a cópia local. Se a versão no banco mudou, baixe o rascunho em JSON para comparar. Salve uma revisão para registrar as alterações da referência, que fica fora do rascunho e do JSON do modelo. A exportação privada da empresa inclui os arquivos de referência dentro do limite da exportação.

**Salvar modelo** registra a revisão oficial no banco e limpa a cópia local usada nessa edição. É essa revisão que pode aparecer no timelapse e no portal. Em dispositivos compartilhados, use **Descartar rascunho** ao reabrir o modelo para remover uma cópia local que não precisa mais ficar no navegador.

Para continuar em outro computador, expanda **Rascunho privado no servidor** e clique em **Guardar rascunho no servidor**. Entre com a mesma conta, abra o mesmo modelo e escolha **Recuperar rascunho do servidor**. Cada conta possui uma cópia privada por modelo. Se outra sessão alterou essa cópia, atualize a consulta antes de substituir ou excluir. Rascunhos com versão base anterior podem ser comparados ou baixados. Salvar a revisão oficial remove a cópia do servidor usada nessa edição se ela ainda estiver na mesma versão.

## Pavimentos e visualização

O seletor define o pavimento ativo. Em **Pavimento e estrutura**, altere nome, cota e altura, crie um pavimento vazio ou duplique o pavimento com todos os elementos. A duplicação cria novos identificadores e mantém os vínculos das aberturas às novas paredes. A cota inicial é colocada acima do pavimento mais alto e pode ser ajustada.

Somente pavimentos vazios podem ser excluídos; deve permanecer ao menos um. A planta mostra o pavimento ativo, e a vista 3D pode mostrar todos. **Enquadrar modelo** reposiciona as vistas. O editor pode operar só em planta quando WebGL não estiver disponível; nesse caso informa a indisponibilidade da vista 3D.

## Revisões, conflitos e arquivos

Cada salvamento confirmado com mudanças cria uma revisão completa com responsável, data e motivo. **Revisões salvas** permite restaurar um estado anterior como uma nova revisão; o histórico não é apagado. As revisões são relacionais e não oferecem garantia criptográfica contra alterações diretas no banco.

Em **Revisões salvas → Abrir timelapse**, reproduza as revisões em ordem cronológica ou navegue até uma revisão pelo controle de posição. Cada quadro usa a geometria efetivamente salva. A reprodução é uma visualização e preserva o rascunho de edição. O intervalo entre quadros é fixo e representa a sequência dos salvamentos.

O servidor compara a versão do modelo antes de gravar. Se outra sessão tiver salvado, retorna conflito e preserva o rascunho. Em **Comparar com o banco**, veja as plantas lado a lado, por pavimento e com o mesmo enquadramento inicial. A legenda conta os elementos adicionados em verde, removidos em vermelho e alterados em laranja. A comparação usa o identificador de cada elemento. Use **Enquadrar as duas plantas** para voltar à escala comum após mover ou ampliar uma vista.

**Exportar projeto JSON** baixa o estado atual, inclusive alterações locais. **Importar projeto JSON** aplica o arquivo como edição local ao modelo aberto. Trocar de obra ou modelo durante a leitura cancela a aplicação do arquivo. Confira nome, medidas e pavimentos antes de salvar. A importação pode ser desfeita. O arquivo contém a geometria e as anotações daquele projeto.

Arquivar um modelo é reversível, preserva revisões e bloqueia a edição até reativá-lo. Use **Incluir arquivados** para localizar modelos arquivados. O backup H2 já inclui modelos e revisões porque eles estão no mesmo banco; PostgreSQL exige seu backup próprio.

## Permissões e limites

SUPER_ADMIN, GERENTE_OBRA, ENGENHEIRO e ARQUITETO podem editar. MESTRE_OBRA, AUDITOR e INCORPORADOR podem consultar, reproduzir revisões e exportar. O escopo por obra segue a autorização existente por empresa.

O **Superadministrador** pode publicar uma revisão salva para uma unidade da mesma obra. Abra **Compartilhar planta com o cliente**, selecione a unidade, informe a revisão e clique em **Aplicar publicação**. Uma unidade pode ter várias plantas publicadas. Em **Acessos externos**, vincule a conta Cliente a cada unidade permitida, inclusive em obras diferentes. No portal, **Ver plantas da unidade** abre a revisão publicada em 2D e 3D, com opção de preparar o PDF em escala.

Um modelo tem uma unidade de publicação. Duplicar cria uma cópia privada que pode ser publicada em outra unidade. **Ocultar do portal**, arquivar o modelo ou revogar o vínculo da conta retira o acesso. Ao reativar uma planta arquivada, a publicação anterior volta a aparecer. A revisão publicada fica fixa até o administrador publicar outra. Publicações anteriores à mudança mantêm a revisão que o cliente já via na atualização.

Use **Ver prévia da revisão** para conferir a geometria em 2D e 3D antes de aplicar a publicação. Em **Ver histórico de publicação**, o administrador pode consultar a ação, revisão, unidade, autor e horário. O histórico detalhado é registrado a partir desta atualização.

Limites por modelo: 50 pavimentos, 2.000 elementos, 32 aberturas por parede e aproximadamente 2 MB de documento JSON. O histórico pode crescer com novas revisões; dimensione banco e retenção conforme o uso. O editor carrega sob demanda e libera recursos gráficos ao fechar a vista. A capacidade máxima não representa uma certificação de desempenho em qualquer dispositivo.

Esta implementação é um editor arquitetônico básico para paredes, aberturas, lajes, pilares, ambientes, cotas e pavimentos. A aprovação técnica e o cálculo estrutural exigem um processo separado. O Leitor IFC extrai propriedades e quantidades em uma tela própria. O arquivo JSON exportado pelo modelador permite reimportar a geometria no Obra360.

## Paredes conectadas, ambientes e cotas

O formato de documento 2 adiciona nós, cotas e identificações de ambiente. Modelos e revisões do formato 1 continuam aceitos. Os novos campos ficam no documento JSON versionado; não foi preciso recriar as tabelas dos modelos.

**Conectar extremidades ao desenhar** está habilitado inicialmente. Ao desenhar perto de uma extremidade existente, há encaixe; paredes com extremidades coincidentes compartilham um nó. **Conectar paredes do pavimento** também conecta os encontros coincidentes de modelos existentes. Selecione uma parede e arraste os nós laranja na planta: as paredes ligadas ao nó são recalculadas juntas. Alterações que fariam uma abertura sair da parede são recusadas. As uniões são por eixo/extremidades; não há acabamento paramétrico de encontros, biséis ou mitras. Encontros em T e cruzamentos entram no cálculo de ambientes por interseções virtuais, sem dividir ou associar automaticamente a parede atravessada.

**Identificar ambientes** encontra faces fechadas do grafo das paredes do pavimento, inclusive divisões por interseções, contornos côncavos e regiões aninhadas. Paredes soltas que não fecham contorno não formam ambientes. Paredes coincidentes/sobrepostas no mesmo eixo precisam ser corrigidas. O cálculo automático admite até 400 paredes por pavimento e limita a complexidade de interseções. A área e o perímetro são medidos **pelo eixo das paredes**, sem descontar espessuras: não são área útil, área de venda ou quantitativo normativo. Portas/janelas não abrem o contorno lógico dos ambientes.

Nomeie os ambientes na lista. Mudanças de geometria recalculam os valores exibidos; os nomes são associados pelo conjunto de paredes ou pela posição do rótulo. Rótulos sem contorno compatível geram aviso, sem inventar área. Reexecute Identificar ambientes para reconstruir os rótulos; Desfazer recupera o estado anterior. Os polígonos e áreas são derivados na interface, não valores cadastrais de área útil confirmados pelo servidor.

**Cotar parede selecionada** cria uma cota vinculada aos nós da parede. **Desenhar cota** permite arrastar entre dois pontos da planta. Cotas podem ser alinhadas, horizontais ou verticais, com afastamento positivo/negativo e exibição em metros. Quando vinculadas, acompanham os nós. Cotas entre pontos livres não acompanham paredes; a lista permite editar coordenadas, desvincular e excluir. Duplicar um pavimento preserva suas cotas e ambientes com novos identificadores/vínculos. Limites adicionais por modelo: 4.000 nós, 500 cotas e 500 identificações de ambiente.

## Impressão em escala

Em **Preparar impressão em escala**, escolha papel A4/A3 em paisagem, escala, responsável informado e número da folha. Selecione a inclusão de cotas e ambientes. A janela separada contém a planta, legenda e carimbo. **Imprimir / Salvar PDF** usa a função de impressão do navegador.

O SVG usa dimensões físicas em milímetros. O sistema bloqueia a abertura quando o desenho não cabe na folha e escala escolhidas; não aplica redução automática. Na impressão, mantenha **100%**, papel/orientação indicados, margens de 10 mm e cabeçalhos/rodapés do navegador desativados. Calibre a impressora antes de usar medidas físicas. Foi verificado que 4 m aparecem com 80 mm na escala 1:50, e o PDF de teste saiu em uma página A4 paisagem.

A folha imprime o estado atual da tela. Alterações não salvas recebem a identificação **RASCUNHO NÃO SALVO**; revisões salvas mostram o número correspondente. O responsável é um texto informado pelo usuário, sem assinatura, ART/RRT ou validação profissional automática. A impressão não certifica o projeto.

## Verificação

Testes de API cobrem persistência, revisões, conflitos, histórico de publicação e isolamento dos rascunhos por conta. Os 51 cenários em PostgreSQL isolado passaram com as migrações até a V22. Os testes de navegador conferiram os destaques da comparação. A jornada integrada recuperou um rascunho em outro contexto de navegador, conferiu a prévia e abriu a revisão publicada em 2D e 3D no portal.
