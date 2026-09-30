<p align="center">
  <img
    src="./docs/images/playwright-automation-lab-banner.png"
    alt="Playwright Automation Lab — automação Web, API e testes de sistemas com LLM usando Playwright e TypeScript"
    width="100%"
  />
</p>

<p align="center">
  <a href="https://github.com/RoxaneNayara/playwright-automation-lab/actions/workflows/playwright.yml">
    <img
      src="https://github.com/RoxaneNayara/playwright-automation-lab/actions/workflows/playwright.yml/badge.svg"
      alt="Playwright Tests"
    />
  </a>
</p>

# Playwright Automation Lab

## Sobre o projeto

O **Playwright Automation Lab** é um projeto autoral desenvolvido com **Playwright** e **TypeScript** para estudo, experimentação e demonstração técnica de práticas de Qualidade de Software.

O laboratório foi concluído em seu **escopo atual**, reunindo três trilhas principais:

- automação Web;
- testes de API;
- testes de sistemas baseados em LLM.

Ao longo do projeto foram explorados testes funcionais, cenários end-to-end, regras de negócio, robustez, acessibilidade, RAG, embeddings, evals, prompt injection, Agents e Tool Calling, regressão, observabilidade, controle de custo e integração contínua.

Mais do que validar respostas ou interfaces, o projeto busca demonstrar como diferentes características de qualidade podem ser avaliadas de forma automatizada, estruturada e reproduzível.

> **Status:** projeto concluído no escopo atual, consolidado na release v2.0.0.

## Como o projeto foi pensado

O laboratório foi organizado em trilhas independentes para preservar clareza, responsabilidade e evolução técnica.

Cada trilha possui objetivos próprios, mas compartilha os mesmos princípios de engenharia:

- testes legíveis e com intenção clara;
- separação entre fluxo, dados e validação;
- automação como apoio à estratégia de qualidade;
- critérios de aprovação explícitos;
- preocupação com manutenção, confiabilidade e custo;
- uso de CI/CD como mecanismo de feedback contínuo.

O projeto também diferencia **exemplos de estudo**, **provas de conceito** e **padrões que podem servir como referência**, evitando tratar experimentos como soluções prontas para produção.

## Trilhas do laboratório

### Automação Web

A trilha Web utiliza **TodoMVC** e **SauceDemo** para estudar:

- jornadas funcionais e end-to-end;
- regras de negócio;
- Page Object Model;
- flows reutilizáveis;
- smoke tests;
- acessibilidade automatizada;
- execução cross-browser em Chromium, Firefox e WebKit.

A suíte Web possui **23 cenários automatizados** e **69 execuções cross-browser**.

### Testes de API

A trilha de API utiliza a **DummyJSON API** como aplicação pública independente do laboratório.

Os cenários exploram:

- operações CRUD;
- busca e paginação;
- cenários negativos;
- robustez de entrada;
- validação de estrutura e comportamento;
- limites e dados inválidos;
- respostas observadas em operações simuladas.

A suíte de API possui **16 cenários automatizados**.

### Testes de sistemas com LLM

A trilha LLM foi construída de forma progressiva, partindo de fundamentos até cenários de avaliação, segurança e governança.

Os estudos incluem:

- interação com modelos e structured output;
- instruction following e validação de respostas;
- embeddings, similaridade semântica e retrieval;
- RAG, múltiplas fontes, thresholds e safe fallback;
- métricas de retrieval e evals;
- groundedness e source attribution;
- prompt injection;
- regression testing e model comparison;
- observabilidade de tokens, latência e custo;
- quality guards e budget guards;
- Agents e Tool Calling;
- segurança contra Tool Injection;
- preparação e avaliação de Fine-tuning.

Os thresholds, datasets e critérios usados nessa trilha são **experimentais** e foram definidos para fins de estudo.

## Arquitetura do projeto

O repositório mantém separação clara entre Web, API e LLM.

```text
playwright-automation-lab
├── .github
│   └── workflows
├── config
├── docs
├── src
│   ├── core
│   └── web
│       ├── flows
│       ├── pages
│       └── support
├── tests
│   ├── api
│   ├── llm
│   │   ├── agents
│   │   ├── embeddings
│   │   ├── evals
│   │   ├── fine-tuning
│   │   ├── fundamentals
│   │   ├── groundedness
│   │   ├── instructionFollowing
│   │   ├── observability
│   │   ├── promptInjection
│   │   ├── rag
│   │   ├── regression
│   │   ├── structuredOutput
│   │   └── validation
│   └── web
│       ├── sauceDemo
│       └── todo
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

## Qualidade e engenharia

O laboratório utiliza controles de qualidade de código e automação para reduzir inconsistências e manter a suíte sustentável.

Principais componentes:

- **Playwright Test** para execução e organização dos cenários;
- **TypeScript** para tipagem e manutenção;
- **ESLint** para análise estática;
- **Prettier** para padronização de estilo;
- **Axe Core** para acessibilidade automatizada;
- **Playwright HTML Report** e **Allure** para evidências e análise;
- **GitHub Actions** para integração contínua;
- **OpenAI SDK** para cenários experimentais com LLM.

## CI/CD

O GitHub Actions funciona como uma camada de qualidade do projeto.

A pipeline executa verificações de:

```text
Checkout
→ dependências
→ navegadores
→ Prettier
→ TypeScript
→ ESLint
→ LLM quality gates
→ testes Web cross-browser
→ relatórios
```

Os cenários de LLM executados no CI são selecionados como **quality gates**, evitando rodar indiscriminadamente testes de maior custo ou operações externas que não precisam fazer parte de toda execução.

A chave da OpenAI é fornecida ao workflow por meio de **GitHub Actions Secrets** e não é armazenada no repositório.

## Decisões técnicas importantes

Algumas decisões do laboratório foram tomadas para preservar independência, clareza e segurança técnica.

### API pública externa

A trilha de testes de API utiliza uma API pública independente para que o laboratório de automação não dependa de sistemas autorais em desenvolvimento.

### Critérios experimentais em LLM

Métricas como Precision@K, Recall@K, F1, MRR, nDCG, thresholds de qualidade, custo e latência são utilizadas como critérios de estudo e não como padrões universais de produção.

### Fine-tuning

A trilha de Fine-tuning inclui preparação de dataset, JSONL, validação de qualidade, baseline, decision gates e upload real de arquivo com `purpose: fine-tune`.

Nos experimentos realizados, o modelo base atingiu **100% de acurácia** nos conjuntos controlados avaliados, não apresentando evidência de necessidade de treinamento para essa tarefa específica.

Também foi realizada uma tentativa real de criação de job de Fine-tuning. O dataset foi aceito e processado, porém a criação do job retornou `HTTP 403` devido à indisponibilidade da funcionalidade para a organização utilizada no laboratório.

O exemplo correspondente foi preservado fora da suíte automática.

## Status atual

Atualmente o laboratório reúne:

- automação Web consolidada;
- testes de API pública;
- trilha dedicada a testes de sistemas com LLM;
- relatórios Playwright e Allure;
- quality gates no GitHub Actions;
- controle de formatação, tipagem e lint;
- execução cross-browser;
- testes e experimentos de regressão, observabilidade, segurança e avaliação de modelos.

O escopo planejado para esta etapa do laboratório foi concluído, contemplando automação Web, API e experimentação de qualidade em sistemas baseados em LLM.

## Classificação do projeto

Este repositório representa um **projeto autoral de estudo, experimentação e prova de conceito em automação e Qualidade de Software**.

O projeto está **concluído em seu escopo atual**, mas não representa uma implementação corporativa ou uma solução de produção.

Os padrões, arquiteturas e abordagens implementados podem servir como referência técnica, porém devem ser avaliados e adaptados antes do uso em sistemas reais, considerando fatores como:

- arquitetura;
- segurança;
- dados;
- ambientes;
- criticidade;
- custo;
- estratégia de testes.

Na trilha de LLM, thresholds, datasets e critérios de aprovação possuem caráter experimental e foram definidos para os cenários controlados do laboratório.

Resultados obtidos nesses experimentos não devem ser interpretados como garantia de comportamento equivalente em ambientes de produção.

## Releases

A release mais recente, **v2.0.0 — Expansão do Lab**, consolida a evolução do projeto para além da automação Web, incorporando as trilhas de **API** e **testes de sistemas com LLM** ao escopo do laboratório.

A versão anterior, **v1.0.0 — Automação Web**, marcou a primeira etapa do projeto, reunindo:

- 23 cenários automatizados Web;
- 69 execuções cross-browser;
- Chromium, Firefox e WebKit.

A `v2.0.0` representa o escopo atual concluído do laboratório, abrangendo:

- automação Web;
- testes de API;
- testes de sistemas com LLM;
- acessibilidade automatizada;
- integração contínua;
- quality gates;
- relatórios Playwright e Allure;
- experimentos com RAG, embeddings, evals, Agents, Tool Calling, segurança, observabilidade e Fine-tuning.

[Ver releases do projeto](https://github.com/RoxaneNayara/playwright-automation-lab/releases)

## Possíveis extensões futuras

O projeto está concluído no escopo atual. As ideias abaixo representam possibilidades de expansão e não pendências necessárias para sua conclusão:

- criação de clients e models reutilizáveis para API;
- validação de contratos com JSON Schema;
- autenticação reutilizável;
- testes seguros de segurança de API;
- integração entre API e interface;
- geração de dados por API;
- regressão visual;
- publicação navegável do Allure;
- ampliação dos datasets de avaliação de LLM;
- evolução dos quality gates de LLM;
- externalização e reutilização de datasets.

Essas extensões poderão ser exploradas futuramente conforme novos objetivos de estudo ou experimentação.

## Autora

**Roxane Nayara**

QA Lead | Coordenadora de QA, com atuação em estratégia de testes, liderança de qualidade, desenvolvimento de pessoas, automação, governança e melhoria contínua.

GitHub: [RoxaneNayara](https://github.com/RoxaneNayara)
