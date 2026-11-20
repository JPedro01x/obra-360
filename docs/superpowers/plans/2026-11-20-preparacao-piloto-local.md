# Preparação de piloto local — Implementation Plan

**Goal:** Preparar piloto, instalação e operação locais, corrigindo impedimentos observados e distinguindo ensaio técnico de aceite real.

**Architecture:** Manter Spring Boot/React, banco relacional e arquivos locais; usar bases descartáveis e configurações privadas. Sem nuvem de arquivos, MFA ou ativação de provedores sem contas.

**Tech Stack:** Java 21, Maven, React, PostgreSQL/H2, Kafka, GitHub Actions.

**Spec:** Solicitação de 20/11/2026; usuário confirmou que ainda não há empresa real ou contas de provedores e pediu preparação local.

## Tasks

- [ ] Investigar CI do commit a77fe51: resolução do parent Maven no Docker e divergências de datas nos testes PostgreSQL. Corrigir causas com evidência reproduzível, preservando regras de negócio.
- [ ] Revalidar as alterações em instalações/bases isoladas. Não substituir a demonstração nem atribuir sucesso a um ensaio Docker não executado.
- [ ] Consolidar roteiro de piloto, responsabilidades e critérios de ativação/homologação de e-mail, Google, IA e SEFAZ, mantendo aprovações reais pendentes.
- [ ] Revisar segurança internamente com evidência de código; corrigir achados concretos. Não apresentar esta revisão como auditoria independente.
- [ ] Registrar resultados, comandos e impedimentos externos. Não cadastrar empresa real, contratar serviços ou simular assinaturas/aceites.

## Ownership

Primary: reprodução de dependências/instalação e integração dos resultados. Trabalho paralelo independente: datas financeiras do CI; revisão de segurança somente leitura; documentação operacional/piloto. Não compartilhar saídas de build Maven entre trabalhadores.
