package br.com.obra360.application.service;

import br.com.obra360.domain.entity.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.math.RoundingMode;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class RhHistoricoService {
    private final EntityManager em;
    private final ObjectMapper mapper;
    private static final Set<String> FUNCTIONAL=Set.of("salarioBase","departamentoId","cargoId","projetoObraId","equipeId","jornadaSemanalMinutos","vinculo");

    /** Only employment data: no CPF, personal contacts, passwords or clinical information. */
    public Map<String,Object> snapshot(RhFuncionarioEntity f){
        Map<String,Object> state=new LinkedHashMap<>();
        state.put("matricula",f.getMatricula());state.put("nome",f.getNome());
        state.put("salarioBase",f.getSalarioBase()==null?null:f.getSalarioBase().setScale(2,RoundingMode.UNNECESSARY).toPlainString());
        state.put("vinculo",f.getVinculo());state.put("situacao",f.getSituacao());
        state.put("admissao",f.getAdmissao()==null?null:f.getAdmissao().toString());state.put("desligamento",f.getDesligamento()==null?null:f.getDesligamento().toString());
        state.put("departamentoId",f.getDepartamentoId());state.put("cargoId",f.getCargoId());
        state.put("projetoObraId",f.getProjetoObraId());state.put("equipeId",f.getEquipeId());state.put("usuarioId",f.getUsuarioId());
        state.put("jornadaSemanalMinutos",f.getJornadaSemanalMinutos());
        state.put("departamento",structureName(f.getDepartamentoId()));state.put("cargo",structureName(f.getCargoId()));
        var project=f.getProjetoObraId()==null?null:em.find(ProjetoObraEntity.class,f.getProjetoObraId());state.put("obra",project==null?null:project.getNome());
        var team=f.getEquipeId()==null?null:em.find(EquipeTrabalhoEntity.class,f.getEquipeId());state.put("equipe",team==null?null:team.getNomeEquipe());
        return state;
    }
    private String structureName(Long id){var e=id==null?null:em.find(RhEstruturaEntity.class,id);return e==null?null:e.getNome();}
    private String json(Map<String,Object> value){try{return mapper.writeValueAsString(value);}catch(JsonProcessingException e){throw new IllegalStateException(e);}}
    private void event(RhFuncionarioEntity f,Long actor,String type,String reason,LocalDate date,Map<String,Object> before,Map<String,Object> after,List<String> fields){
        var e=new RhHistoricoEntity();e.setEmpresaId(f.getEmpresaId());e.setFuncionarioId(f.getId());e.setUsuarioId(actor);e.setTipo(type);e.setMotivo(reason);e.setDataReferencia(date);e.setCamposAlterados(String.join(",",fields));e.setEstadoAnterior(before==null?null:json(before));e.setEstadoAtual(json(after));em.persist(e);
    }
    public void record(RhFuncionarioEntity f,Map<String,Object> before,Long actor,String reason){
        Map<String,Object> after=snapshot(f);
        if(before==null){event(f,actor,"ADMISSAO","Cadastro de admissão registrado",f.getAdmissao(),null,after,List.of());return;}
        List<String> changed=after.keySet().stream().filter(k->!Objects.equals(before.get(k),after.get(k))).toList();
        if(changed.isEmpty())return;
        if(changed.stream().anyMatch(FUNCTIONAL::contains)&&(reason==null||reason.isBlank()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe o motivo da alteração salarial, de vínculo, jornada, cargo ou alocação.");
        long count=em.createQuery("select count(e) from RhHistoricoEntity e where e.empresaId=:t and e.funcionarioId=:f",Long.class).setParameter("t",f.getEmpresaId()).setParameter("f",f.getId()).getSingleResult();
        if(count==0)event(f,actor,"BASE_INICIAL","Situação observada antes da primeira alteração rastreada; histórico anterior indisponível",LocalDate.now(),null,before,List.of());
        boolean termination="DESLIGADO".equals(f.getSituacao())&&!Objects.equals(before.get("situacao"),after.get("situacao"));
        event(f,actor,termination?"DESLIGAMENTO":"ALTERACAO",reason==null||reason.isBlank()?"Atualização cadastral":reason.trim(),termination?f.getDesligamento():LocalDate.now(),before,after,changed);
    }
}
