# 🏗️ Obra360 - Plataforma Integrada de Gestão da Construção Civil & Mercado Imobiliário

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture-emerald.svg)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
[![React 18](https://img.shields.io/badge/Frontend-React%2018-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js-black.svg)](https://threejs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-purple.svg)](https://web.dev/progressive-web-apps/)

**Obra360** é uma plataforma corporativa web e ecossistema digital integrado (*SaaS Multi-Tenant B2B/B2C*) destinado a construtoras, incorporadoras, escritórios de engenharia e arquitetura, fornecedores de insumos, locadoras de equipamentos, imobiliárias, investidores e clientes finais.

A solução integra todo o ciclo de vida de um empreendimento — desde a análise de viabilidade de terrenos e projetos 3D BIM, passando pelo planejamento WBS, controle de estoque com conciliação NFe, até a comercialização imobiliária, espelho de vendas, entrega de chaves e gestão de garantias pós-obra (NBR 15575).

---

## 👨‍💻 Desenvolvedores & Orientador

* **Desenvolvedores:** João Pedro & Marcos Henrique
* **Professor Orientador:** Dennys Carvalho
* **Disciplina:** Projeto Integrador / Engenharia de Software
* **Instituição:** AESA-CESA (2026)

---

## ✨ Funcionalidades Principais

* **🏢 Gestão Multi-Empresas (Multi-Tenant SaaS):** Alternância instantânea e cadastro corporativo com CNPJ verificado.
* **🏗️ Suporte a 9 Categorias de Empreendimentos:** Casas, Condomínios Fechados, Prédios, Hospitais, Galpões, Túneis, Infraestrutura e Comercial.
* **📦 Almoxarifado com Conciliação NFe:** Controle de saldo SKU por movimento (ENTRADA/SAÍDA) com validação de chave de 44 dígitos da Nota Fiscal Eletrônica.
* **📐 Central de Projetos 2D/3D BIM:** Versionamento de pranchas (`v1.0`, `v2.0`, `v2.4`), status de homologação, carimbos digitais e download em IFC/DWG.
* **🧊 Visualizador 3D BIM & Time-Lapse (Three.js):** Renderização tridimensional procedural, inspeção espacial (X, Y, Z) e simulação semanal de avanço (Semana 1 a 8).
* **🛡️ Fiscalização ISO 9001 e Laudos NR-18:** Registro de ocorrências com severidade (Alta, Média, Baixa), fotos do canteiro e atestado de segurança.
* **🛒 Marketplace B2B & Frotas Pesadas:** Cotações RFQ comparativas de insumos e contratação de escavadeiras/guindastes.
* **🏠 Espelho de Vendas & Simulador Financeiro:** Matriz de unidades (Disponível, Reservado, Vendido), cálculo de comissão de corretores (3%) e financiamento em 360 parcelas.
* **🔑 Portal do Proprietário & Pós-Venda NBR 15575:** Acompanhamento do avanço físico, diário de obra e chamados de assistência técnica com SLA de 24h.
* **💬 Chat B2B Ao Vivo:** Comunicação em tempo real separada por canais operacionais.
* **🤖 Obra360 Copilot IA:** Assistente de Inteligência Artificial para tira-dúvidas de normas técnicas (NR-18 e NBR 15575).
* **📶 PWA Offline Mode:** Service Worker (`sw.js`) para operação em canteiros de obras sem sinal de internet.

---

## 🛠️ Tecnologias & Arquitetura

O projeto adota rigorosamente os princípios de **Clean Architecture** organizados em 4 camadas desacopladas:

1. **Domain Layer (`src/types.ts`):** Entidades fundamentais e contratos de domínio sem dependências externas.
2. **Use Cases Layer (`src/services/api.ts`):** Casos de uso assíncronos e regras de negócio com anotações `@requirement`.
3. **Presenters / Utils (`src/utils/`):** Formatadores de dados, gerador de PDF (`exportUtils.ts`) e exportador CSV.
4. **Drivers / Infrastructure Layer (`src/components/` & `src/services/`):** React 18, Three.js, Tailwind CSS, PubSub EventBus (`eventBus.ts`), Logger Estruturado JSON (`logger.ts`) e Service Worker (`sw.js`).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js** (versão 18.x ou superior)
* **npm** ou **yarn**

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/JPedro01x/obra-360.git
   cd obra-360
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Executar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abrir no navegador:**
   Acesse [http://localhost:3000/](http://localhost:3000/)

5. **Gerar a compilação de produção (Zero Errors):**
   ```bash
   npm run build
   ```

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
