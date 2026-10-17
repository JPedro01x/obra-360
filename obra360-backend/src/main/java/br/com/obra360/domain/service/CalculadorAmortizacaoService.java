package br.com.obra360.domain.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Serviço de Domínio responsável por calcular simulações de financiamento imobiliário
 * utilizando as tabelas SAC (Sistema de Amortização Constante) e PRICE (Sistema Francês de Amortização)
 * corrigidas pelo índice de inflação do setor da construção civil (INCC-M).
 */
@Service
public class CalculadorAmortizacaoService {

    public record ParcelaSac(int numeroParcela, BigDecimal saldoDevedorInicial, BigDecimal valorAmortizacao, BigDecimal valorJuros, BigDecimal correcaoIncc, BigDecimal valorPrestacaoTotal, BigDecimal saldoDevedorFinal) {}
    public record ParcelaPrice(int numeroParcela, BigDecimal saldoDevedorInicial, BigDecimal valorAmortizacao, BigDecimal valorJuros, BigDecimal correcaoIncc, BigDecimal valorPrestacaoTotal, BigDecimal saldoDevedorFinal) {}

    /**
     * Calcula a tabela de amortização SAC (Amortização Constante + Juros Decrescentes)
     */
    public List<ParcelaSac> calcularTabelaSac(BigDecimal valorFinanciado, BigDecimal taxaJurosAnual, int totalMeses, BigDecimal inccMensal) {
        List<ParcelaSac> parcelas = new ArrayList<>();
        BigDecimal saldoDevedor = valorFinanciado;
        BigDecimal taxaJurosMensal = taxaJurosAnual.divide(BigDecimal.valueOf(12 * 100), 8, RoundingMode.HALF_UP);
        BigDecimal amortizacaoBase = valorFinanciado.divide(BigDecimal.valueOf(totalMeses), 2, RoundingMode.HALF_UP);

        for (int mes = 1; mes <= totalMeses; mes++) {
            BigDecimal juros = saldoDevedor.multiply(taxaJurosMensal).setScale(2, RoundingMode.HALF_UP);
            BigDecimal correcaoIncc = saldoDevedor.multiply(inccMensal.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal prestacao = amortizacaoBase.add(juros).add(correcaoIncc);
            BigDecimal saldoFinal = saldoDevedor.subtract(amortizacaoBase);

            if (saldoFinal.compareTo(BigDecimal.ZERO) < 0 || mes == totalMeses) {
                saldoFinal = BigDecimal.ZERO;
            }

            parcelas.add(new ParcelaSac(mes, saldoDevedor, amortizacaoBase, juros, correcaoIncc, prestacao, saldoFinal));
            saldoDevedor = saldoFinal;
        }

        return parcelas;
    }

    /**
     * Calcula a tabela de amortização PRICE (Prestação Fixa Base + Amortização Crescente)
     */
    public List<ParcelaPrice> calcularTabelaPrice(BigDecimal valorFinanciado, BigDecimal taxaJurosAnual, int totalMeses, BigDecimal inccMensal) {
        List<ParcelaPrice> parcelas = new ArrayList<>();
        BigDecimal saldoDevedor = valorFinanciado;
        double i = taxaJurosAnual.doubleValue() / (12 * 100);
        double pv = valorFinanciado.doubleValue();
        double pmt = pv * (i * Math.pow(1 + i, totalMeses)) / (Math.pow(1 + i, totalMeses) - 1);
        BigDecimal prestacaoBase = BigDecimal.valueOf(pmt).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxaJurosMensal = BigDecimal.valueOf(i);

        for (int mes = 1; mes <= totalMeses; mes++) {
            BigDecimal juros = saldoDevedor.multiply(taxaJurosMensal).setScale(2, RoundingMode.HALF_UP);
            BigDecimal amortizacao = prestacaoBase.subtract(juros);
            BigDecimal correcaoIncc = saldoDevedor.multiply(inccMensal.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal prestacaoTotal = prestacaoBase.add(correcaoIncc);
            BigDecimal saldoFinal = saldoDevedor.subtract(amortizacao);

            if (saldoFinal.compareTo(BigDecimal.ZERO) < 0 || mes == totalMeses) {
                saldoFinal = BigDecimal.ZERO;
            }

            parcelas.add(new ParcelaPrice(mes, saldoDevedor, amortizacao, juros, correcaoIncc, prestacaoTotal, saldoFinal));
            saldoDevedor = saldoFinal;
        }

        return parcelas;
    }
}
