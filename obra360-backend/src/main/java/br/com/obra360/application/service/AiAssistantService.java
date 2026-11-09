package br.com.obra360.application.service;

import com.fasterxml.jackson.databind.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service @RequiredArgsConstructor
public class AiAssistantService {
    private final IntegrationConfig config;private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
    private final Map<Long,ArrayDeque<Long>> requests=new ConcurrentHashMap<>();
    public boolean available(){return config.enabled("AI_ENABLED")&&config.has("OPENAI_API_KEY","AI_MODEL");}
    public String ask(Long user,String question){
        config.require(available(),"Assistente de IA");var queue=requests.computeIfAbsent(user,k->new ArrayDeque<>());long now=System.currentTimeMillis();synchronized(queue){while(!queue.isEmpty()&&queue.peek()<now-60000)queue.remove();if(queue.size()>=5)throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Limite de cinco perguntas por minuto.");queue.add(now);}
        try {
            int limit=Math.max(128,Math.min(2048,Integer.parseInt(config.get("AI_MAX_OUTPUT_TOKENS","800"))));
            String body=json.writeValueAsString(Map.of("model",config.get("AI_MODEL"),"store",false,"max_output_tokens",limit,"instructions","Responda em português com base apenas nas informações fornecidas. Você auxilia na organização de obras. Não invente registros, valores, normas ou resultados de serviços. Não execute ações nem prometa gravações. Distingua sugestões de informações verificadas.","input",question));
            var request=HttpRequest.newBuilder(config.endpoint(config.get("AI_API_URL","https://api.openai.com/v1/responses"))).timeout(Duration.ofSeconds(35)).header("Authorization","Bearer "+config.get("OPENAI_API_KEY")).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
            var response=http.send(request,HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200||response.body().length()>2000000)throw new IllegalStateException("Resposta indisponível.");
            JsonNode payload=json.readTree(response.body());StringBuilder text=new StringBuilder();for(JsonNode output:payload.path("output"))for(JsonNode content:output.path("content")){if("output_text".equals(content.path("type").asText()))text.append(content.path("text").asText()).append('\n');}
            if(text.isEmpty())throw new IllegalStateException("Resposta sem texto.");return text.toString().trim();
        }catch(InterruptedException ex){Thread.currentThread().interrupt();throw unavailable();}catch(Exception ex){throw unavailable();}
    }
    private ResponseStatusException unavailable(){return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"O provedor de IA não concluiu a resposta. Nenhum registro foi alterado.");}
}
