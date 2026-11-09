package br.com.obra360.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service @RequiredArgsConstructor
public class ModeloDocumentoService {
    private final ObjectMapper mapper;
    private final Validator validator;
    private void reject(String message){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
    public void validate(ModeloDocumento doc){
        if(doc==null||!validator.validate(doc).isEmpty())reject("Confira pavimentos, tipos, medidas, nomes e cores do modelo.");
        Map<String,ModeloDocumento.Pavimento> floors=new HashMap<>();Set<String> ids=new HashSet<>();
        for(var p:doc.pavimentos()){
            if(p==null||!Double.isFinite(p.cota())||!Double.isFinite(p.altura()))reject("Cotas e alturas precisam ser finitas.");
            if(!ids.add(p.id()))reject("Identificadores repetidos no modelo.");floors.put(p.id(),p);
        }
        Map<String,ModeloDocumento.Elemento> elements=new HashMap<>();Map<String,List<ModeloDocumento.Elemento>> openings=new HashMap<>();
        Map<String,ModeloDocumento.No> nodes=new HashMap<>();
        for(var n:doc.nos()){
            if(n==null||!floors.containsKey(n.pavimentoId())||!ids.add(n.id())||!Double.isFinite(n.x())||!Double.isFinite(n.z()))reject("Nó de parede inválido ou repetido.");nodes.put(n.id(),n);
        }
        if(doc.schemaVersao()==1&&(!doc.nos().isEmpty()||!doc.cotas().isEmpty()||!doc.ambientes().isEmpty()))reject("Use schemaVersao 2 para nós, cotas e ambientes.");
        for(var e:doc.elementos()){
            if(e==null)reject("Elemento inválido.");
            for(double n:new double[]{e.x(),e.z(),e.base(),e.largura(),e.profundidade(),e.altura(),e.rotacao(),e.deslocamento()})if(!Double.isFinite(n))reject("Medidas precisam ser finitas.");
            if(!ids.add(e.id()))reject("Identificadores repetidos no modelo.");
            var floor=floors.get(e.pavimentoId());if(floor==null)reject("Elemento vinculado a pavimento inexistente.");
            elements.put(e.id(),e);
            if(e.noInicioId()!=null||e.noFimId()!=null){
                if(doc.schemaVersao()!=2||!e.tipo().equals("PAREDE")||e.noInicioId()==null||e.noFimId()==null||e.noInicioId().equals(e.noFimId()))reject("Conexão de parede inválida.");
                var a=nodes.get(e.noInicioId());var b=nodes.get(e.noFimId());
                if(a==null||b==null||!a.pavimentoId().equals(e.pavimentoId())||!b.pavimentoId().equals(e.pavimentoId()))reject("Parede e nós precisam estar no mesmo pavimento.");
                double angle=Math.toRadians(e.rotacao()),half=e.largura()/2;
                if(Math.hypot(e.x()-Math.cos(angle)*half-a.x(),e.z()+Math.sin(angle)*half-a.z())>0.001||Math.hypot(e.x()+Math.cos(angle)*half-b.x(),e.z()-Math.sin(angle)*half-b.z())>0.001)reject("Medidas da parede divergem de seus nós conectados.");
            }
            boolean opening=Set.of("PORTA","JANELA").contains(e.tipo());
            if(!opening){
                if(e.paredeId()!=null||Math.abs(e.deslocamento())>0.000001)reject("Somente portas e janelas usam parede e deslocamento.");
                if(!e.tipo().equals("LAJE")&&e.base()+e.altura()>floor.altura()+0.000001)reject("Elemento ultrapassa a altura do pavimento.");
            }else{if(e.paredeId()==null)reject("Portas e janelas precisam de uma parede.");openings.computeIfAbsent(e.paredeId(),k->new ArrayList<>()).add(e);}
        }
        for(var c:doc.cotas()){
            if(c==null||!ids.add(c.id())||!floors.containsKey(c.pavimentoId()))reject("Cota inválida ou repetida.");
            for(double n:new double[]{c.ax(),c.az(),c.bx(),c.bz(),c.afastamento()})if(!Double.isFinite(n))reject("Coordenadas da cota inválidas.");
            for(String ref:new String[]{c.noAId(),c.noBId()})if(ref!=null){var n=nodes.get(ref);if(n==null||!n.pavimentoId().equals(c.pavimentoId()))reject("Cota vinculada a nó inexistente.");}
            if(c.noAId()!=null){var n=nodes.get(c.noAId());if(Math.hypot(c.ax()-n.x(),c.az()-n.z())>0.001)reject("Extremidade A da cota desatualizada.");}
            if(c.noBId()!=null){var n=nodes.get(c.noBId());if(Math.hypot(c.bx()-n.x(),c.bz()-n.z())>0.001)reject("Extremidade B da cota desatualizada.");}
            double distance=c.tipo().equals("HORIZONTAL")?Math.abs(c.bx()-c.ax()):c.tipo().equals("VERTICAL")?Math.abs(c.bz()-c.az()):Math.hypot(c.bx()-c.ax(),c.bz()-c.az());
            if(distance<0.01)reject("Cota precisa medir ao menos 0,01 m no eixo escolhido.");
        }
        for(var r:doc.ambientes()){
            if(r==null||!ids.add(r.id())||!floors.containsKey(r.pavimentoId())||!Double.isFinite(r.x())||!Double.isFinite(r.z()))reject("Identificação de ambiente inválida.");
            for(String id:r.paredeIds()){var wall=elements.get(id);if(wall==null||!wall.tipo().equals("PAREDE")||!wall.pavimentoId().equals(r.pavimentoId()))reject("Referência de parede do ambiente inválida.");}
        }
        for(var entry:openings.entrySet()){
            var wall=elements.get(entry.getKey());if(wall==null||!wall.tipo().equals("PAREDE"))reject("Abertura vinculada a parede inexistente.");
            if(entry.getValue().size()>32)reject("Limite de 32 aberturas por parede.");
            for(var o:entry.getValue()){
                if(!o.pavimentoId().equals(wall.pavimentoId()))reject("Abertura e parede precisam estar no mesmo pavimento.");
                if(Math.abs(o.x())>0.000001||Math.abs(o.z())>0.000001||Math.abs(o.rotacao())>0.000001)reject("A posição da abertura é relativa à parede.");
                if(o.tipo().equals("PORTA")&&Math.abs(o.base())>0.000001)reject("A porta deve iniciar na base da parede.");
                if(Math.abs(o.deslocamento())+o.largura()/2>wall.largura()/2+0.000001||o.base()+o.altura()>wall.altura()+0.000001)reject("Abertura não cabe nos limites da parede.");
            }
            var list=entry.getValue();for(int i=0;i<list.size();i++)for(int j=i+1;j<list.size();j++){
                var a=list.get(i);var b=list.get(j);
                if(Math.abs(a.deslocamento()-b.deslocamento())<(a.largura()+b.largura())/2-0.000001&&Math.max(a.base(),b.base())<Math.min(a.base()+a.altura(),b.base()+b.altura())-0.000001)reject("Portas ou janelas se sobrepõem na mesma parede.");
            }
        }
    }
    public String encode(ModeloDocumento doc){validate(doc);try{String value=mapper.writeValueAsString(doc);if(value.length()>2000000)reject("Modelo excede o limite de dados.");return value;}catch(JsonProcessingException e){throw new IllegalStateException(e);}}
    public ModeloDocumento decode(String value){try{return mapper.readValue(value,ModeloDocumento.class);}catch(JsonProcessingException e){throw new IllegalStateException("Documento de modelo inválido no banco.",e);}}
}
