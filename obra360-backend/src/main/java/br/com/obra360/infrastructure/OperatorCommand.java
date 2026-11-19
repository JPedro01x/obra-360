package br.com.obra360.infrastructure;
import br.com.obra360.application.service.ProvisionamentoService;
import org.springframework.boot.*;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component @Profile("operador") @RequiredArgsConstructor
public class OperatorCommand implements CommandLineRunner {
    private final ProvisionamentoService service;private final Environment env;private final ConfigurableApplicationContext context;
    private final br.com.obra360.application.service.RetencaoOperacionalService retention;
    private String required(String key){String value=env.getProperty(key);if(value==null||value.isBlank())throw new IllegalArgumentException("Variável obrigatória ausente: "+key);return value;}
    public void run(String...args){
        if(!"none".equalsIgnoreCase(env.getProperty("spring.main.web-application-type")))throw new IllegalStateException("Operador exige spring.main.web-application-type=none.");
        String action=required("OP_ACTION");
        if("limpar-expirados".equals(action)){
            System.out.println(retention.clean(Long.valueOf(required("OP_COMPANY_ID")),Integer.parseInt(env.getProperty("OP_RETENTION_DAYS","90")),Boolean.parseBoolean(env.getProperty("OP_APPLY","false"))));
            SpringApplication.exit(context,()->0);return;
        }
        if("limpar-mensageria".equals(action)){
            System.out.println(retention.cleanMessaging(Long.valueOf(required("OP_COMPANY_ID")),Integer.parseInt(env.getProperty("OP_RETENTION_DAYS","90")),Boolean.parseBoolean(env.getProperty("OP_APPLY","false"))));
            SpringApplication.exit(context,()->0);return;
        }
        int users=Integer.parseInt(required("OP_LIMIT_USERS")),projects=Integer.parseInt(required("OP_LIMIT_PROJECTS")),models=Integer.parseInt(required("OP_LIMIT_MODELS"));
        if("criar-empresa".equals(action)){
            Long id=service.create(required("OP_COMPANY_NAME"),required("OP_LEGAL_NAME"),required("OP_CNPJ"),required("OP_ADMIN_NAME"),required("OP_ADMIN_EMAIL"),required("OP_ADMIN_PASSWORD"),required("OP_DATA_ENVIRONMENT"),users,projects,models);
            System.out.println("Empresa provisionada. ID="+id+". Cadastro informado pelo operador; veracidade não atestada automaticamente.");
        }else if("ajustar-limites".equals(action)){service.license(Long.valueOf(required("OP_COMPANY_ID")),users,projects,models,required("OP_PLAN"));System.out.println("Limites atualizados.");}
        else throw new IllegalArgumentException("OP_ACTION deve ser criar-empresa, ajustar-limites, limpar-expirados ou limpar-mensageria.");
        SpringApplication.exit(context,()->0);
    }
}
