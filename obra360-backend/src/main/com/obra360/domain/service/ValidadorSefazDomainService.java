package br.com.obra360.domain.service;

import org.springframework.stereotype.Service;

/**
 * Serviço de Domínio responsável por executar a validação matemática do Dígito Verificador (DV)
 * de Chaves de Acesso de Nota Fiscal Eletrônica (NFe) com 44 dígitos utilizando o Algoritmo Módulo 11 da SEFAZ.
 */
@Service
public class ValidadorSefazDomainService {

    /**
     * Valida se uma chave de NFe de 44 dígitos é matematicamente válida segundo o Módulo 11 da SEFAZ.
     *
     * @param chaveNfe Chave de 44 dígitos numéricos da NFe.
     * @return true se o Dígito Verificador (DV) for válido; false caso contrário.
     */
    public boolean validarChaveNfe44Digitos(String chaveNfe) {
        if (chaveNfe == null || chaveNfe.trim().length() != 44) {
            return false;
        }

        String chaveLimpa = chaveNfe.replaceAll("\\D", "");
        if (chaveLimpa.length() != 44) {
            return false;
        }

        // Os primeiros 43 dígitos formam o corpo; o 44º é o Dígito Verificador (DV)
        String corpoChave = chaveLimpa.substring(0, 43);
        int dvInformado = Character.getNumericValue(chaveLimpa.charAt(43));

        int dvCalculado = calcularDigitoVerificadorModulo11(corpoChave);

        return dvInformado == dvCalculado;
    }

    /**
     * Calcula o Dígito Verificador (DV) Módulo 11 da SEFAZ para os 43 dígitos iniciais.
     */
    private int calcularDigitoVerificadorModulo11(String corpoChave) {
        int soma = 0;
        int peso = 2;

        // Ponderação da direita para a esquerda com pesos de 2 a 9
        for (int i = corpoChave.length() - 1; i >= 0; i--) {
            int digito = Character.getNumericValue(corpoChave.charAt(i));
            soma += digito * peso;
            peso++;
            if (peso > 9) {
                peso = 2;
            }
        }

        int resto = soma % 11;
        int dvCalculado = 11 - resto;

        if (resto == 0 || resto == 1) {
            return 0;
        }

        return dvCalculado;
    }
}
