# Stability Lab — Playwright + TypeScript

Laboratório experimental dedicado ao estudo de estabilidade de testes automatizados, identificação de _flaky tests_, investigação de falhas e aplicação de boas práticas recomendadas pelo Playwright.

## Objetivo

Reproduzir problemas comuns de sincronização em ambientes controlados, compreender suas causas e comparar implementações instáveis com abordagens mais confiáveis.

Os testes utilizam páginas HTML criadas com `page.setContent()`, sem dependência de aplicações externas.

## Experimentos — Sincronização

| ID  | Experimento              | Objetivo                                                       | Execução padrão |
| --- | ------------------------ | -------------------------------------------------------------- | --------------- |
| 01  | Auto-waiting             | Demonstrar a espera automática antes de interagir com um botão | Ativo           |
| 02  | Espera fixa insuficiente | Reproduzir uma falha causada por verificação antecipada        | Ignorado        |
| 03  | Web-first assertion      | Demonstrar uma assertion com espera automática                 | Ativo           |
| 04  | Comportamento flaky      | Simular atrasos variáveis e resultados inconsistentes          | Ignorado        |
| 05  | Correção do flaky        | Corrigir a sincronização com `toBeVisible()`                   | Ativo           |

## Execução

Executar a suíte:

```bash
npm run test:stability
```

Repetir um cenário selecionado dez vezes:

```bash
npm run test:stability -- --grep "deve corrigir comportamento flaky" --repeat-each=10
```

Executar com até duas tentativas adicionais após uma falha:

```bash
npm run test:stability -- --grep "deve corrigir comportamento flaky" --retries=2
```

## Diagnóstico

Os experimentos utilizam recursos do Playwright para investigar falhas:

- HTML Report
- Trace Viewer
- Screenshots
- Vídeos das execuções com falha

Para abrir o relatório:

```bash
npx playwright show-report
```

## Observações importantes

- Os experimentos 02 e 04 contêm falhas intencionais e estão marcados com `test.skip()`.
- Para reproduzi-los novamente, é necessário remover temporariamente o `skip`.
- As exceções locais do ESLint são justificadas por objetivos didáticos.
- Retries ajudam a identificar e administrar instabilidades, mas não corrigem suas causas.
- Dez execuções bem-sucedidas não garantem ausência definitiva de flaky tests.
- Os exemplos são materiais de estudo, não padrões aprovados para testes de produção.

## Referências oficiais

- [Playwright — Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright — Auto-waiting](https://playwright.dev/docs/actionability)
- [Playwright — Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright — Retries](https://playwright.dev/docs/test-retries)
- [Playwright — Trace Viewer](https://playwright.dev/docs/trace-viewer)
