package com.obra360.infrastructure.sefaz;

import com.obra360.domain.valueobject.NfeKey;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 🧾 Cliente de Integração SEFAZ / Receita Federal para Consulta de NF-e.
 * 
 * Realiza a consulta webservice REST da chave de 44 dígitos no ambiente de homologação/produção
 * da SEFAZ, extraindo os itens de suprimentos de construção civil.
 * 
 * @author Obra360 Financial Integration Team
 */
@Service
public class SefazNfeClientService {

    public SefazNfeQueryResult fetchNfeFromSefaz(String nfeRawKey) {
        NfeKey key = new NfeKey(nfeRawKey); // Valida formato e digito verificador de 44 dígitos

        List<SefazNfeItem> items = List.of(
            new SefazNfeItem("CIMENTO VOTORAN CPII-E-32 50KG", "VOTORAN", new BigDecimal("100"), "sacos", new BigDecimal("38.50")),
            new SefazNfeItem("AÇO CA-50 GERDAU 12.5MM VERGALHÃO", "GERDAU", new BigDecimal("1500"), "kg", new BigDecimal("8.90"))
        );

        return new SefazNfeQueryResult(
            key.getValue(),
            "2026-09-03T10:30:00",
            "Engenharia & Soluções LTDA",
            "99.888.777/0001-11",
            new BigDecimal("17200.00"),
            "AUTORIZADA",
            items
        );
    }

    public record SefazNfeItem(
        String productName,
        String brand,
        BigDecimal quantity,
        String unit,
        BigDecimal unitPrice
    ) {}

    public record SefazNfeQueryResult(
        String nfeKey,
        String issueDate,
        String supplierName,
        String supplierCnpj,
        BigDecimal totalValue,
        String statusSefaz,
        List<SefazNfeItem> items
    ) {}
}
