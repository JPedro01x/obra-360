package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.io.*;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.zip.*;
import java.security.MessageDigest;

@Service @RequiredArgsConstructor
public class ExportacaoEmpresaService {
    private final EntityManager em;private final ObjectMapper json;private final DocumentStorage storage;
    private static final int MAX_BYTES=25*1024*1024,MAX_ROWS=10000;
    private static final List<String> DIRECT=List.of("UsuarioEntity","ProjetoObraEntity","FornecedorB2BEntity","ItemEstoqueEntity","ContratoServicoEntity","CotacaoB2BEntity","AcessoExternoEntity","LogAuditoriaEntity","ModeloObraEntity","ModeloRevisaoEntity","RhAfastamentoEntity","RhBeneficioEntity","RhCandidatoEntity","RhDocumentoEntity","RhEstruturaEntity","RhFolhaEntity","RhFuncionarioEntity","RhHistoricoEntity","RhLancamentoEntity","RhPontoEntity","RhTreinamentoEntity","RhVagaEntity","SolicitacaoAtendimentoEntity");
    private static final String PROJECT="e.projetoObraId in (select p.id from ProjetoObraEntity p where p.empresaId=:t)";
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public byte[] export(Long tenant) throws IOException {
        var output=new ByteArrayOutputStream();long[] budget={0,0};var counts=new LinkedHashMap<String,Integer>();
        try(var zip=new ZipOutputStream(output)){
            write(zip,"empresa.json",json.writeValueAsBytes(em.find(EmpresaEntity.class,tenant)),budget);
            Map<String,String> scopes=new LinkedHashMap<>();DIRECT.forEach(e->scopes.put(e,"e.empresaId=:t"));
            for(String e:List.of("DocumentoProjetoEntity","EquipeTrabalhoEntity","EtapaCronogramaEntity","OcorrenciaQualidadeEntity","UnidadeImobiliariaEntity"))scopes.put(e,PROJECT);
            scopes.put("MovimentacaoEstoqueEntity","e.itemEstoqueId in (select i.id from ItemEstoqueEntity i where i.empresaId=:t)");
            scopes.put("ConsumoOrdemEntity","e.itemEstoqueId in (select i.id from ItemEstoqueEntity i where i.empresaId=:t)");
            scopes.put("SolicitacaoServicoEntity","e.contratoServicoId in (select c.id from ContratoServicoEntity c where c.empresaId=:t)");
            scopes.put("GarantiaPosVendaEntity","e.unidadeImobiliariaId in (select u.id from UnidadeImobiliariaEntity u where u.projetoObraId in (select p.id from ProjetoObraEntity p where p.empresaId=:t))");
            scopes.put("MensagemChatEntity","e.remetenteId in (select u.id from UsuarioEntity u where u.empresaId=:t) and e.destinatarioId in (select u.id from UsuarioEntity u where u.empresaId=:t)");
            for(var entry:scopes.entrySet()){
                int page=0,count=0;
                while(true){
                    var rows=em.createQuery("select e from "+entry.getKey()+" e where "+entry.getValue()+" order by e.id").setParameter("t",tenant).setFirstResult(page++*50).setMaxResults(50).getResultList();
                    if(rows.isEmpty())break;
                    for(Object row:rows){
                        if(++budget[1]>MAX_ROWS)throw tooLarge();
                        ObjectNode node=json.valueToTree(row);
                        if(row instanceof UsuarioEntity)node.remove(List.of("senhaHash","googleSubject","versaoCredencial","tentativasLoginFalhas","bloqueadoAte"));
                        write(zip,"registros/"+entry.getKey()+"/"+(++count)+".json",json.writeValueAsBytes(node),budget);
                        if(row instanceof DocumentoProjetoEntity d)file(zip,"arquivos/projeto-"+d.getId(),storage.read(d.getUrlArmazenamento()),d.getHashArquivoSha256(),budget);
                        if(row instanceof RhDocumentoEntity d)file(zip,"arquivos/rh-"+d.getId(),storage.readRh(d.getReferenciaArquivo()),d.getSha256(),budget);
                    }
                    em.clear();
                }
                counts.put(entry.getKey(),count);
            }
            write(zip,"manifesto.json",json.writeValueAsBytes(Map.of("formato","obra360-export-v1","empresaId",tenant,"geradoEm",OffsetDateTime.now(),"contagens",counts,"credenciaisIncluidas",false,"observacao","Dados operacionais e arquivos da empresa. Não é backup restaurável do servidor. Sessões, MFA, tokens e convites não são exportados.")),budget);
        }
        return output.toByteArray();
    }
    private void file(ZipOutputStream zip,String name,byte[] bytes,String expected,long[] budget)throws IOException{
        try{String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));if(!hash.equalsIgnoreCase(expected))throw new ResponseStatusException(HttpStatus.CONFLICT,"Integridade de arquivo divergente. Corrija antes de exportar.");}
        catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}write(zip,name,bytes,budget);
    }
    private void write(ZipOutputStream zip,String name,byte[] bytes,long[] budget)throws IOException{
        budget[0]+=bytes.length;if(budget[0]>MAX_BYTES)throw tooLarge();zip.putNextEntry(new ZipEntry(name));zip.write(bytes);zip.closeEntry();
    }
    private ResponseStatusException tooLarge(){return new ResponseStatusException(HttpStatus.CONFLICT,"Exportação excede 25 MB ou 10 mil registros. Solicite uma exportação assistida em Atendimento.");}
}
