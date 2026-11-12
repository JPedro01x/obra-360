package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.TenantContext;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.function.Predicate;

/** Read-only, tenant-scoped projections. Never returns personnel or authentication secrets. */
@Service
@Transactional(readOnly=true)
public class DetalhesCadastroService {
    private final EntityManager em;
    public DetalhesCadastroService(EntityManager em){this.em=em;}
    public record Column(String label,String type){}
    public record Section(String key,String title,String resource,List<Column> columns,List<List<Object>> rows,long total,int page){}
    public record Metric(String label,Object value,String type,String note){}
    private Column col(String label){return new Column(label,"text");}
    private Column money(String label){return new Column(label,"money");}
    private Column date(String label){return new Column(label,"date");}
    private class View {
        final List<Section> sections=new ArrayList<>();final List<Metric> metrics=new ArrayList<>();
        final String selected;final int page;final Predicate<String> readable;
        View(String selected,int page,Predicate<String> readable){this.selected=selected;this.page=page;this.readable=readable;}
        void add(String key,String title,String resource,String columns,String from,List<Column> labels,Long id){
            if(!selected.isEmpty()&&!selected.equals(key))return;
            if(!resource.isEmpty()&&!readable.test(resource))return;
            int current=key.equals(selected)?page:0;
            var rows=em.createQuery("select "+columns+" "+from+" order by e.id desc",Object[].class)
                .setParameter("tenant",TenantContext.getCurrentTenant()).setParameter("id",id).setFirstResult(current*10).setMaxResults(10).getResultList();
            long count=em.createQuery("select count(e) "+from,Long.class).setParameter("tenant",TenantContext.getCurrentTenant()).setParameter("id",id).getSingleResult();
            sections.add(new Section(key,title,resource,labels,rows.stream().map(r->Arrays.asList(r)).toList(),count,current));
        }
        void project(Long id){add("obra","Obra","projetos","e.id,e.nome,e.dataInicio,e.dataPrevisaoFim","from ProjetoObraEntity e where e.empresaId=:tenant and e.id=:id",List.of(col("ID"),col("Nome"),date("Início"),date("Entrega prevista")),id);}
        void teams(Long project){add("equipes","Equipes e encarregados","equipes","e.id,e.nomeEquipe,u.nome,e.especialidade,e.quantidadeOperarios","from EquipeTrabalhoEntity e join ProjetoObraEntity p on p.id=e.projetoObraId join UsuarioEntity u on u.id=e.liderEncarregadoId and u.empresaId=p.empresaId where p.empresaId=:tenant and p.id=:id",List.of(col("ID"),col("Equipe"),col("Encarregado"),col("Especialidade"),col("Quantidade declarada")),project);}
        void members(Long id,boolean team){
            add("membros","Membros alocados (RH)","","e.id,e.nome,c.nome,t.nomeEquipe,e.situacao","from RhFuncionarioEntity e join RhEstruturaEntity c on c.id=e.cargoId and c.empresaId=e.empresaId left join EquipeTrabalhoEntity t on t.id=e.equipeId where e.empresaId=:tenant and e."+(team?"equipeId":"projetoObraId")+"=:id",List.of(col("ID"),col("Nome"),col("Cargo"),col("Equipe"),col("Situação")),id);
        }
        void contracts(Long id,boolean supplier){add("contratos","Contratos","contratos","e.id,e.numeroContrato,e.valorTotal,e.ativo","from ContratoServicoEntity e where e.empresaId=:tenant and e."+(supplier?"fornecedorB2bId":"projetoObraId")+"=:id",List.of(col("ID"),col("Contrato"),money("Valor contratado"),col("Ativo")),id);}
        void orders(Long id,String filter){add("ordens","Ordens de serviço","ordens","e.id,e.codigoProtocolo,e.descricao,e.statusOs,e.dataLimiteSla","from SolicitacaoServicoEntity e join ContratoServicoEntity c on c.id=e.contratoServicoId where c.empresaId=:tenant and "+filter+"=:id",List.of(col("ID"),col("Protocolo"),col("Serviço"),col("Situação"),date("Prazo")),id);}
        void supplier(Long id){add("fornecedor","Fornecedor","fornecedores","e.id,e.razaoSocial,e.cnpj,e.categoriaFornecimento","from FornecedorB2BEntity e where e.empresaId=:tenant and e.id=:id",List.of(col("ID"),col("Razão social"),col("CNPJ"),col("Categoria")),id);}
        void stock(Long id){add("material","Material","estoque","e.id,e.nome,e.sku,e.quantidadeAtual,e.unidadeMedida","from ItemEstoqueEntity e where e.empresaId=:tenant and e.id=:id",List.of(col("ID"),col("Material"),col("SKU"),col("Saldo"),col("Unidade")),id);}
        void unit(Long id){add("unidade","Unidade imobiliária","unidades","e.id,e.codigoUnidade,e.statusVenda,e.areaPrivativaM2","from UnidadeImobiliariaEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and e.id=:id",List.of(col("ID"),col("Unidade"),col("Situação"),col("Área (m²)")),id);}
        void quotes(Long id,boolean supplier){add("cotacoes","Cotações","cotacoes","e.id,e.codigoCotacao,e.valorProposta,e.statusCotacao,e.prazoEntregaDias","from CotacaoB2BEntity e where e.empresaId=:tenant and e."+(supplier?"fornecedorB2bId":"requisicaoCompraId")+"=:id",List.of(col("ID"),col("Cotação"),money("Proposta"),col("Situação"),col("Entrega em dias")),id);}
    }
    private Object value(String select,String from,Long id){return em.createQuery("select "+select+" "+from).setParameter("tenant",TenantContext.getCurrentTenant()).setParameter("id",id).getSingleResult();}
    public Map<String,Object> details(String resource,Object record,String section,int page,Predicate<String> readable,boolean models){
        var v=new View(section,page,readable);
        if(record instanceof ProjetoObraEntity p){
            Long id=p.getId();
            var engineer=em.createQuery("select u.nome from UsuarioEntity u where u.empresaId=:tenant and u.id=:id",String.class).setParameter("tenant",TenantContext.getCurrentTenant()).setParameter("id",p.getEngenheiroResponsavelId()).getResultList();
            v.metrics.add(new Metric("Engenheiro responsável",engineer.isEmpty()?null:engineer.get(0),"text","Responsável cadastrado na obra."));
            v.metrics.add(new Metric("Evolução do cronograma",value("avg(e.percentualExecutado)","from EtapaCronogramaEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and p.id=:id",id),"percent","Média simples das etapas cadastradas; sem etapas, evolução não informada."));
            if(readable.test("contratos")){
                v.metrics.add(new Metric("Investimento aprovado",null,"money","Nenhum orçamento de investimento aprovado informado nesta visão."));
                v.metrics.add(new Metric("VGV estimado",p.getVgvEstimado(),"money","Estimativa de vendas; não é o investimento nem o orçamento da obra."));
                v.metrics.add(new Metric("Contratos ativos",value("coalesce(sum(e.valorTotal),0)","from ContratoServicoEntity e where e.empresaId=:tenant and e.projetoObraId=:id and e.ativo=true",id),"money","Compromissos contratados; não comprovam pagamento."));
                v.metrics.add(new Metric("Materiais consumidos",value("coalesce(sum(e.custoTotalInsumo),0)","from ConsumoOrdemEntity e join ItemEstoqueEntity i on i.id=e.itemEstoqueId where i.empresaId=:tenant and i.projetoObraId=:id",id),"money","Consumos registrados nas OS; não representa o gasto total da obra."));
                v.metrics.add(new Metric("Compras recebidas",value("coalesce(sum(m.valorTotal),0)","from RequisicaoCompraEntity e join ItemEstoqueEntity i on i.id=e.itemEstoqueId join MovimentacaoEstoqueEntity m on m.id=e.movimentacaoId where e.empresaId=:tenant and i.projetoObraId=:id and e.status='RECEBIDO'",id),"money","Valor dos recebimentos registrados; não somar ao consumo dos mesmos materiais."));
            }
            v.teams(id);v.members(id,false);v.contracts(id,false);v.orders(id,"c.projetoObraId");
            v.add("cronograma","Etapas e evolução","cronograma","e.id,e.nomeEtapa,e.percentualExecutado,e.dataInicioPrevista,e.dataFimPrevista","from EtapaCronogramaEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and p.id=:id",List.of(col("ID"),col("Etapa"),new Column("Executado (%)","number"),date("Início previsto"),date("Fim previsto")),id);
            v.add("estoque","Materiais em estoque","estoque","e.id,e.nome,e.quantidadeAtual,e.unidadeMedida","from ItemEstoqueEntity e where e.empresaId=:tenant and e.projetoObraId=:id",List.of(col("ID"),col("Material"),col("Saldo"),col("Unidade")),id);
            v.add("documentos","Documentos e plantas anexadas","documentos","e.id,e.titulo,e.tipoDocumento,e.nomeArquivo","from DocumentoProjetoEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and p.id=:id",List.of(col("ID"),col("Título"),col("Tipo"),col("Arquivo")),id);
            if(models)v.add("plantas","Plantas e modelos 2D/3D","","e.id,e.nome,e.revisao,e.arquivado,e.atualizadoEm","from ModeloObraEntity e where e.empresaId=:tenant and e.projetoObraId=:id",List.of(col("ID"),col("Modelo"),col("Revisão"),col("Arquivado"),date("Atualizado em")),id);
            if(readable.test("unidades"))v.add("clientes","Clientes vinculados aos portais","","e.id,u.nome,u.email,e.unidadeImobiliariaId","from AcessoExternoEntity e join UsuarioEntity u on u.id=e.usuarioId and u.empresaId=e.empresaId where e.empresaId=:tenant and e.projetoObraId=:id and e.perfil='CLIENTE'",List.of(col("Vínculo"),col("Cliente"),col("E-mail"),col("Unidade (ID)")),id);
            v.add("unidades","Unidades imobiliárias","unidades","e.id,e.codigoUnidade,e.statusVenda,e.areaPrivativaM2","from UnidadeImobiliariaEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and p.id=:id",List.of(col("ID"),col("Unidade"),col("Situação"),col("Área (m²)")),id);
            v.add("qualidade","Qualidade e segurança","qualidade","e.id,e.titulo,e.grauSeveridade,e.statusPlanoAcao","from OcorrenciaQualidadeEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and p.id=:id",List.of(col("ID"),col("Ocorrência"),col("Severidade"),col("Situação")),id);
        }else if(record instanceof EquipeTrabalhoEntity t){
            v.project(t.getProjetoObraId());v.teams(t.getProjetoObraId());v.members(t.getId(),true);v.orders(t.getId(),"e.equipeTrabalhoId");
        }else if(record instanceof FornecedorB2BEntity s){v.contracts(s.getId(),true);v.quotes(s.getId(),true);
        }else if(record instanceof ContratoServicoEntity c){v.project(c.getProjetoObraId());v.supplier(c.getFornecedorB2bId());v.orders(c.getId(),"c.id");
        }else if(record instanceof SolicitacaoServicoEntity o){
            var c=em.find(ContratoServicoEntity.class,o.getContratoServicoId());v.project(c.getProjetoObraId());v.contracts(c.getProjetoObraId(),false);
            v.add("equipe","Equipe responsável","equipes","e.id,e.nomeEquipe,u.nome,e.especialidade","from EquipeTrabalhoEntity e join ProjetoObraEntity p on p.id=e.projetoObraId join UsuarioEntity u on u.id=e.liderEncarregadoId and u.empresaId=p.empresaId where p.empresaId=:tenant and e.id=:id",List.of(col("ID"),col("Equipe"),col("Encarregado"),col("Especialidade")),o.getEquipeTrabalhoId());
            v.members(o.getEquipeTrabalhoId(),true);
            v.add("consumos","Materiais consumidos nesta OS","consumos","e.id,i.nome,e.quantidadeUtilizada,e.custoTotalInsumo","from ConsumoOrdemEntity e join ItemEstoqueEntity i on i.id=e.itemEstoqueId where i.empresaId=:tenant and e.ordemServicoId=:id",List.of(col("ID"),col("Material"),col("Quantidade"),money("Custo registrado")),o.getId());
        }else if(record instanceof ItemEstoqueEntity i){
            v.project(i.getProjetoObraId());
            v.add("movimentacoes","Histórico de movimentações","movimentacoes","e.id,e.tipoMovimentacao,e.quantidade,e.valorTotal,e.ordemServicoId","from MovimentacaoEstoqueEntity e join ItemEstoqueEntity i on i.id=e.itemEstoqueId where i.empresaId=:tenant and i.id=:id",List.of(col("ID"),col("Tipo"),col("Quantidade"),money("Valor"),col("OS (ID)")),i.getId());
            v.add("compras","Requisições de compra","compras","e.id,e.numeroPedido,e.quantidade,e.status","from RequisicaoCompraEntity e where e.empresaId=:tenant and e.itemEstoqueId=:id",List.of(col("ID"),col("Pedido"),col("Quantidade"),col("Situação")),i.getId());
        }else if(record instanceof RequisicaoCompraEntity r){v.stock(r.getItemEstoqueId());v.quotes(r.getId(),false);
        }else if(record instanceof CotacaoB2BEntity q){v.supplier(q.getFornecedorB2bId());
            if(q.getRequisicaoCompraId()!=null)v.add("compra","Requisição de compra","compras","e.id,e.numeroPedido,e.quantidade,e.status","from RequisicaoCompraEntity e where e.empresaId=:tenant and e.id=:id",List.of(col("ID"),col("Pedido"),col("Quantidade"),col("Situação")),q.getRequisicaoCompraId());
        }else if(record instanceof DocumentoProjetoEntity d){v.project(d.getProjetoObraId());
        }else if(record instanceof EtapaCronogramaEntity e){v.project(e.getProjetoObraId());v.teams(e.getProjetoObraId());
        }else if(record instanceof OcorrenciaQualidadeEntity o){v.project(o.getProjetoObraId());
        }else if(record instanceof UnidadeImobiliariaEntity u){v.project(u.getProjetoObraId());
            v.add("coberturas","Coberturas de garantia","coberturas","e.id,e.categoria,e.dataInicio,e.dataFim,e.ativo","from CoberturaGarantiaEntity e where e.empresaId=:tenant and e.unidadeId=:id",List.of(col("ID"),col("Categoria"),date("Início"),date("Fim"),col("Ativa")),u.getId());
            v.add("garantias","Chamados de pós-venda","garantias","e.id,e.descricaoDefeito,e.statusChamado","from GarantiaPosVendaEntity e join UnidadeImobiliariaEntity u on u.id=e.unidadeImobiliariaId join ProjetoObraEntity p on p.id=u.projetoObraId where p.empresaId=:tenant and u.id=:id",List.of(col("ID"),col("Problema"),col("Situação")),u.getId());
        }else if(record instanceof CoberturaGarantiaEntity c){v.unit(c.getUnidadeId());
        }else if(record instanceof GarantiaPosVendaEntity g){v.unit(g.getUnidadeImobiliariaId());
        }else if(record instanceof AcessoExternoEntity a){v.project(a.getProjetoObraId());if(a.getUnidadeImobiliariaId()!=null)v.unit(a.getUnidadeImobiliariaId());if(a.getFornecedorB2bId()!=null)v.supplier(a.getFornecedorB2bId());
        }else if(record instanceof MovimentacaoEstoqueEntity m){v.stock(m.getItemEstoqueId());
        }else if(record instanceof ConsumoOrdemEntity c){v.stock(c.getItemEstoqueId());
        }else if(record instanceof UsuarioEntity u){
            v.add("obras","Obras sob responsabilidade","projetos","e.id,e.nome,e.dataPrevisaoFim","from ProjetoObraEntity e where e.empresaId=:tenant and e.engenheiroResponsavelId=:id",List.of(col("ID"),col("Obra"),date("Entrega prevista")),u.getId());
            v.add("equipes","Equipes sob liderança","equipes","e.id,e.nomeEquipe,e.especialidade","from EquipeTrabalhoEntity e join ProjetoObraEntity p on p.id=e.projetoObraId where p.empresaId=:tenant and e.liderEncarregadoId=:id",List.of(col("ID"),col("Equipe"),col("Especialidade")),u.getId());
        }
        return Map.of("registro",record,"indicadores",v.metrics,"secoes",v.sections);
    }
}
