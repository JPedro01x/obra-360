# Construtora Horizonte — demonstração persistida

Criada por solicitação do responsável em 12/11/2026. Empresa, pessoas, identificadores, obras, contratos e movimentações são fictícios. Os valores simulam uma operação para apresentação e testes; não comprovam atividade empresarial, direito trabalhista, autorização fiscal ou projeto executivo.

A empresa foi provisionada separadamente no banco local existente, sem substituir os cadastros anteriores. A marcação de ambiente é `HOMOLOGACAO`. Os registros foram criados pelas APIs oficiais e conferidos novamente após reiniciar a aplicação, em `obra360-backend/data/obra360.mv.db`.

| Área | Quantidade |
| --- | ---: |
| Empresa fictícia | 1 |
| Obras | 6 |
| Equipes | 18 |
| Contratos | 18 |
| Materiais | 60 |
| Ordens de serviço | 72 |
| Requisições de compra | 18 |
| Documentos PDF demonstrativos | 12 |
| Unidades | 12 |
| Chamados de garantia | 6 |
| Etapas de cronograma | 18 |
| Contas de acesso | 68 |
| Funcionários | 48 |
| Registros de ponto | 240 |
| Benefícios e treinamentos | 48 de cada |
| Folha administrativa com lançamentos manuais | 1 folha, 96 lançamentos |
| Modelos de plantas 2D/3D | 12 |

As obras são Residencial Aurora, Condomínio Jardim das Palmeiras, Edifício Comercial Central, Residencial Vista Verde, Centro Logístico Horizonte e Vila das Acácias, todas identificadas como demonstração. O dimensionamento é uma hipótese de teste, não uma capacidade comercial contratada.

## Processos prontos para experimentar

- OS: 24 abertas, 24 em andamento e 24 concluídas, com consumos vinculados à obra correta.
- Compras: seis recebidas, seis com pedido emitido e seis em aprovação. As recebidas possuem aprovações por pessoas distintas; a entrada e o custo de estoque foram conferidos.
- RH: contas de Colaborador geradas no cadastro dos 48 funcionários, registros de cinco dias úteis, benefícios, treinamentos, solicitações futuras de férias e folha manual registrada como paga. Nenhuma transferência financeira foi feita nem tributo calculado.
- Plantas: duas por obra, cada uma com seis ambientes, paredes conectadas, cotas, seis portas e quatro janelas. Há revisões salvas e publicação para a unidade vinculada ao cliente demonstrativo. As dimensões do contorno foram alinhadas à área cadastrada da unidade; a conferência técnica profissional não é substituída por essa consistência numérica.
- Portais: clientes vinculados às unidades, um cliente com acesso a duas obras, corretores com unidades para reserva, investidores com visão dos projetos e parceiros com propostas demonstrativas. Há seis unidades vendidas, três reservadas e três disponíveis.
- Os arquivos PDF identificam explicitamente que são demonstração sem validade real.

## Entrar na nova empresa

Saia da conta atual e entre com `admin@horizonte-demo.test.invalid`. O administrador da empresa anterior continua vendo apenas sua própria empresa.

As credenciais foram geradas aleatoriamente. O banco guarda os hashes de senha; a cópia privada dos acessos de demonstração fica cifrada em `ACESSO-DEMONSTRACAO.local`, ignorado pelo Git e separado dos acessos antigos.

No terminal privado, para consultar o administrador:

```powershell
npm run acessos:demonstracao -- --perfil SUPER_ADMIN --mostrar-senhas
```

Para listar os logins sem senhas:

```powershell
npm run acessos:demonstracao
```

Colaboradores precisam trocar a senha inicial ao entrar. O arquivo privado registra a senha inicial de teste e não recupera a senha pessoal definida depois. Não reutilize essas contas fora da demonstração nem compartilhe o arquivo de credenciais.

## Conferência e recuperação

```powershell
npm run dados:demonstracao -- --verificar
node scripts/validar-demonstracao.mjs
```

A primeira rotina confere empresa/ambiente, quantidades, estados, 60 saldos e 12 plantas. A segunda abre o frontend real, consulta obras e RH e reabre uma planta em 2D/3D; as capturas locais ficam em `scratch/demonstracao`. Ambas usam os dados já persistidos.

O carregador `scripts/demo-company.mjs` tem destino fixo em loopback e exige a empresa/ambiente esperados. O comando `--popular` usa um registro de progresso privado para retomar a carga; não apaga nem reseta o banco. Após alterações manuais na demonstração, divergências de contagem ou saldo devem ser investigadas, não corrigidas com exclusões automáticas.

Não execute novamente `--provisionar` nesta instalação: a empresa já existe. Esse modo exige API encerrada e backup prévio. Nunca copie o banco operacional para uma apresentação pública sem revisar seu conteúdo.

Foram preservadas cópias do banco antes do provisionamento e após a carga em `backups/`. Para uma entrega em outro computador, o pacote do software e a cópia dos dados são artefatos separados; os arquivos privados e os bancos não entram nos pacotes de fonte/produção.

Essa demonstração permite apresentação e ensaios operacionais. Não preenche o relatório de aceite de cliente real em [PILOTO-COMERCIAL.md](PILOTO-COMERCIAL.md).
