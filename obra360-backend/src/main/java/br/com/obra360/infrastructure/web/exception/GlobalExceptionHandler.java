package br.com.obra360.infrastructure.web.exception;

import br.com.obra360.domain.exception.NfeInvalidaException;
import br.com.obra360.domain.exception.RecursoNaoEncontradoException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;

/**
 * Handler Global de Exceções da API REST do Obra360.
 * Retorna respostas padronizadas segundo o RFC 7807 (Problem Details for HTTP APIs),
 * tratando também erros de concorrência (Race Conditions) e segurança.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({OptimisticLockException.class, ObjectOptimisticLockingFailureException.class})
    public ProblemDetail handleRaceConditionException(Exception ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "Conflito de concorrência detectado: O registro foi modificado por outra operação simultânea. Por favor, tente novamente."
        );
        problemDetail.setTitle("Conflito de Concorrência (Race Condition Prevented)");
        problemDetail.setType(URI.create("https://obra360.com.br/erros/concorrencia-race-condition"));
        problemDetail.setProperty("timestamp", Instant.now());
        problemDetail.setProperty("codigo_erro", "RACE_CONDITION_OPTIMISTIC_LOCK");
        return problemDetail;
    }

    @ExceptionHandler(NfeInvalidaException.class)
    public ProblemDetail handleNfeInvalidaException(NfeInvalidaException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        problemDetail.setTitle("Erro de Conciliação Fiscal NFe");
        problemDetail.setType(URI.create("https://obra360.com.br/erros/nfe-invalida"));
        problemDetail.setProperty("timestamp", Instant.now());
        problemDetail.setProperty("codigo_erro", "FISCAL_NFE_DV_INVALIDO");
        return problemDetail;
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ProblemDetail handleRecursoNaoEncontradoException(RecursoNaoEncontradoException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
        problemDetail.setTitle("Recurso Não Encontrado");
        problemDetail.setType(URI.create("https://obra360.com.br/erros/recurso-nao-encontrado"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno inesperado no servidor."
        );
        problemDetail.setTitle("Erro Interno do Servidor");
        problemDetail.setType(URI.create("https://obra360.com.br/erros/erro-interno"));
        problemDetail.setProperty("timestamp", Instant.now());
        problemDetail.setProperty("mensagem_tecnica", ex.getMessage());
        return problemDetail;
    }
}
