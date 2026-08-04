<p align="center">
  <img
    src="./docs/images/playwright-automation-lab-banner.png"
    alt="Playwright Automation Lab — automação Web e API com Playwright e TypeScript"
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

## Sobre o projeto

Laboratório de automação de testes desenvolvido com **Playwright** e **TypeScript**, criado para estudos, experimentação e demonstração de boas práticas em automação Web e de APIs.

O projeto reúne testes funcionais, cenários end-to-end, validações de regras de negócio, testes de robustez de API, acessibilidade automatizada, execução cross-browser, relatórios e integração contínua com GitHub Actions.

## Status do projeto

- 23 cenários automatizados Web;
- 16 cenários automatizados de API;
- 69 execuções Web cross-browser;
- Chromium, Firefox e WebKit;
- ESLint, Prettier e TypeScript configurados;
- relatórios Playwright e Allure;
- pipeline automatizada no GitHub Actions.

## Aplicações utilizadas

### TodoMVC

Aplicação utilizada para praticar operações básicas de uma lista de tarefas, com cenários de criação, conclusão, exclusão e atualização da lista.

### SauceDemo

Aplicação de demonstração de e-commerce utilizada para automatizar jornadas de login, catálogo, carrinho, checkout, regras financeiras e acessibilidade.

### DummyJSON API

API pública utilizada para estudos de automação de testes de API com Playwright.

A suíte cobre operações CRUD, busca, paginação, cenários negativos e testes de robustez envolvendo campos ausentes, valores vazios ou nulos, tipos incorretos, preços negativos, textos extensos, caracteres especiais e Content-Type incompatível.

As operações de escrita da DummyJSON são simuladas e não persistem os dados. Por isso, os testes validam status HTTP, estrutura da resposta, dados retornados e comportamento observado, sem afirmar persistência real.

## Tecnologias e ferramentas

- Node.js
- TypeScript
- Playwright
- Playwright Test
- Axe Core
- Allure Report
- ESLint
- Prettier
- Git
- GitHub Actions

## Arquitetura do projeto

O projeto separa testes Web e API, configurações, páginas, fluxos e dados de apoio.

```text
playwright-automation-lab
├── .github
│   └── workflows
├── config
├── src
│   ├── core
│   └── web
│       ├── flows
│       ├── pages
│       └── support
├── tests
│   ├── api
│   │   └── dummyJson
│   │       └── products
│   │           ├── atualizar
│   │           ├── buscar
│   │           ├── criar
│   │           │   └── robustez
│   │           ├── excluir
│   │           └── listar
│   └── web
│       ├── sauceDemo
│       └── todo
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

## Padrões utilizados

### Page Object Model

Os elementos e comportamentos das páginas ficam centralizados em classes de página, reduzindo duplicação e mantendo os testes focados nas regras validadas.

### Flows

Fluxos reutilizáveis agrupam sequências de ações realizadas em diferentes testes, sem esconder as validações.

### Dados de teste

Credenciais, produtos e informações de checkout ficam separados dos testes para facilitar manutenção e reutilização.

## Instalação

```bash
git clone https://github.com/RoxaneNayara/playwright-automation-lab.git
cd playwright-automation-lab
npm ci
npx playwright install
```

Em ambientes Linux ou de integração contínua:

```bash
npx playwright install --with-deps
```

## Execução dos testes

### Suíte Web cross-browser

```bash
npm run test:cross-browser
```

### API DummyJSON

```bash
npx playwright test tests/api/dummyJson --project=api-dummyjson
```

### Execuções específicas

```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
npm run test:todo
npm run test:saucedemo
npm run test:smoke
npm run test:headed
```

## Controles de qualidade

```bash
npm run format
npm run format:check
npm run typecheck
npm run lint
```

Rotina recomendada antes de cada commit:

```bash
npm run format
npm run format:check
npm run typecheck
npm run lint
npx playwright test tests/api/dummyJson --project=api-dummyjson
```

## Relatórios

### Playwright HTML

```bash
npx playwright show-report
```

### Allure

```bash
npm run report:generate
npm run report:open
npm run report:serve
```

## Acessibilidade

A suíte utiliza `@axe-core/playwright` para identificar violações automatizadas de acessibilidade.

A automação complementa, mas não substitui, testes manuais com teclado, leitores de tela e avaliação humana.

## GitHub Actions

O workflow está localizado em:

```text
.github/workflows/playwright.yml
```

A pipeline executa:

```text
Checkout
→ instalação das dependências
→ instalação dos navegadores
→ Prettier
→ TypeScript
→ ESLint
→ testes Playwright
→ upload dos relatórios
```

## Tags

Os testes utilizam tags por tipo, aplicação, recurso, operação e característica de qualidade.

Exemplos:

```text
@web
@api
@todo
@sauceDemo
@dummyJson
@products
@smoke
@negative
@robustness
@functionalSuitability
@reliability
@compatibility
@security
```

Execução por tag:

```bash
npx playwright test --grep "@checkout"
```

## Classificação do projeto

Este repositório representa um **laboratório de estudos e prova de conceito**.

Os padrões implementados podem servir como referência, mas devem ser avaliados e adaptados antes do uso em sistemas corporativos, considerando arquitetura, segurança, dados, ambientes, criticidade e estratégia de testes.

## Release atual

A versão **v1.0.0 — Automação Web** reúne 23 cenários automatizados e 69 execuções cross-browser.

[Ver detalhes da release v1.0.0](https://github.com/RoxaneNayara/playwright-automation-lab/releases/tag/v1.0.0)

## Próximas evoluções

- criação de clients e models reutilizáveis para API;
- validação de contratos com JSON Schema;
- autenticação reutilizável;
- testes seguros de segurança de API;
- integração entre API e interface;
- geração de dados por API;
- regressão visual;
- publicação navegável do Allure;
- evolução da documentação.

## Autora

**Roxane Nayara**

QA Lead e Coordenadora de QA, com atuação em estratégia de testes, liderança de qualidade, desenvolvimento de pessoas, automação, governança e melhoria contínua.

GitHub: [RoxaneNayara](https://github.com/RoxaneNayara)
