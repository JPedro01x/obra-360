package br.com.obra360.infrastructure.config;

import br.com.obra360.application.port.out.MedicaoFisicaReadPort;
import br.com.obra360.application.usecase.ListMedicoesFisicas;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MedicaoFisicaUseCaseConfiguration {
    @Bean
    ListMedicoesFisicas listMedicoesFisicas(MedicaoFisicaReadPort readPort) {
        return new ListMedicoesFisicas(readPort);
    }
}
