package com.obra360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * SPRING BOOT 3 MAIN APPLICATION
 * Ponto de entrada do backend corporativo Obra360
 * Habilita execução assíncrona (@EnableAsync) para Use Cases e mensageria EventBus.
 */
@SpringBootApplication
@EnableAsync
public class Obra360BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(Obra360BackendApplication.class, args);
    }
}
