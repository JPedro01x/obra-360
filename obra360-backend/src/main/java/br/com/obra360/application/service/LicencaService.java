package br.com.obra360.application.service;
import br.com.obra360.domain.entity.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import java.util.Map;

@Service @RequiredArgsConstructor @Transactional
public class LicencaService {
    private final EntityManager em;
    private LicencaEmpresaEntity limits(Long tenant,boolean lock){
        var company=em.find(EmpresaEntity.class,tenant,lock?LockModeType.PESSIMISTIC_WRITE:LockModeType.NONE);
        if(company==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var l=em.find(LicencaEmpresaEntity.class,tenant);if(l==null){l=new LicencaEmpresaEntity();l.setEmpresaId(tenant);}return l;
    }
    private long count(String entity,Long tenant,String extra){return em.createQuery("select count(e) from "+entity+" e where e.empresaId=:t"+extra,Long.class).setParameter("t",tenant).getSingleResult();}
    private long pending(Long t){return em.createQuery("select count(c) from ConviteEntity c where c.empresaId=:t and c.usado=false and c.revogado=false and c.expiraEm>:now",Long.class).setParameter("t",t).setParameter("now",OffsetDateTime.now()).getSingleResult();}
    public void user(Long tenant,boolean acceptingReservedInvitation){
        var l=limits(tenant,true);long total=count("UsuarioEntity",tenant," and e.ativo=true")+pending(tenant);
        if(acceptingReservedInvitation?total>l.getLimiteUsuarios():total>=l.getLimiteUsuarios())throw new ResponseStatusException(HttpStatus.CONFLICT,"Limite de usuários atingido. Convites pendentes reservam vagas; revise os acessos ou solicite ajuste ao operador.");
    }
    public void project(Long tenant){var l=limits(tenant,true);if(count("ProjetoObraEntity",tenant,"")>=l.getLimiteProjetos())throw new ResponseStatusException(HttpStatus.CONFLICT,"Limite de obras atingido. Solicite ajuste ao operador.");}
    public void model(Long tenant){var l=limits(tenant,true);if(count("ModeloObraEntity",tenant,"")>=l.getLimiteModelos())throw new ResponseStatusException(HttpStatus.CONFLICT,"Limite de modelos atingido. Solicite ajuste ao operador.");}
    @Transactional(readOnly=true) public Map<String,Object> usage(Long tenant){var l=limits(tenant,false);return Map.of("plano",l.getPlano(),"cobrancaAutomatica",false,"usuariosAtivos",count("UsuarioEntity",tenant," and e.ativo=true"),"convitesPendentes",pending(tenant),"projetos",count("ProjetoObraEntity",tenant,""),"modelos",count("ModeloObraEntity",tenant,""),"limiteUsuarios",l.getLimiteUsuarios(),"limiteProjetos",l.getLimiteProjetos(),"limiteModelos",l.getLimiteModelos());}
}
