package br.com.obra360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
public class Obra360Application {

    public static void main(String[] args) {
        SpringApplication.run(Obra360Application.class, args);
    }
}
