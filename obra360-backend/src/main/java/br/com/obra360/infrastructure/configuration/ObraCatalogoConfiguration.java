package br.com.obra360.infrastructure.configuration;

import br.com.obra360.application.port.out.ObraCatalogoReadPort;
import br.com.obra360.application.usecase.ListObrasPorEmpresa;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class ObraCatalogoConfiguration {
    @Bean ListObrasPorEmpresa listObrasPorEmpresa(ObraCatalogoReadPort readPort) {
        return new ListObrasPorEmpresa(readPort);
    }
}
