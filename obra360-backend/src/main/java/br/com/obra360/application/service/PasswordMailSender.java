package br.com.obra360.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import java.util.Properties;

@Service @RequiredArgsConstructor @Slf4j
public class PasswordMailSender {
    private final IntegrationConfig config;
    public boolean available(){return config.enabled("EMAIL_ENABLED")&&config.has("SMTP_HOST","EMAIL_FROM","APP_PUBLIC_URL");}
    public void send(String recipient,String link){
        config.require(available(),"Recuperação por e-mail");
        JavaMailSenderImpl sender=new JavaMailSenderImpl();sender.setHost(config.get("SMTP_HOST"));
        boolean ssl=config.enabled("SMTP_SSL");boolean local=java.util.Set.of("localhost","127.0.0.1","::1").contains(config.get("SMTP_HOST"));
        boolean tls=!"false".equalsIgnoreCase(config.get("SMTP_STARTTLS"))||(!local&&!ssl);
        sender.setPort(Integer.parseInt(config.get("SMTP_PORT",ssl?"465":"587")));sender.setUsername(config.get("SMTP_USERNAME"));sender.setPassword(config.secret("SMTP_PASSWORD"));sender.setDefaultEncoding("UTF-8");
        Properties properties=sender.getJavaMailProperties();properties.setProperty("mail.smtp.auth",String.valueOf(config.has("SMTP_USERNAME")));properties.setProperty("mail.smtp.starttls.enable",String.valueOf(tls));properties.setProperty("mail.smtp.starttls.required",String.valueOf(tls));properties.setProperty("mail.smtp.ssl.enable",String.valueOf(ssl));properties.setProperty("mail.smtp.connectiontimeout","5000");properties.setProperty("mail.smtp.timeout","5000");properties.setProperty("mail.smtp.writetimeout","5000");
        SimpleMailMessage message=new SimpleMailMessage();message.setFrom(config.get("EMAIL_FROM"));message.setTo(recipient);message.setSubject("Obra360 — redefinição de senha");message.setText("Foi solicitada uma nova senha para sua conta Obra360. O link expira em 15 minutos e só pode ser utilizado uma vez.\n\n"+link+"\n\nSe você não fez a solicitação, ignore esta mensagem.");sender.send(message);
    }
}

