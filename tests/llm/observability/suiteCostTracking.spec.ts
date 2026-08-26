import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const INPUT_PRICE_PER_MILLION = 0.2;
const OUTPUT_PRICE_PER_MILLION = 1.2;

type CallMetrics = {
  id: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
  estimatedCostUSD: number;
};

const calculateEstimatedCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;

  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

  return inputCost + outputCost;
};

const average = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

test.describe('LLM - Observability - Suite Cost Tracking', () => {
  test('deve calcular consumo agregado de tokens, latência e custo da suíte', async () => {
    test.setTimeout(120_000);

    const client = new OpenAI();

    const model = 'gpt-5.6-luna';

    const scenarios = [
      {
        id: 'CASE_1',
        question: 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?',
        context: 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.',
      },
      {
        id: 'CASE_2',
        question: 'O que acontece durante o período de bloqueio?',
        context: 'Durante o bloqueio, novas tentativas de autenticação não são permitidas.',
      },
      {
        id: 'CASE_3',
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        context: 'O prazo médio para a primeira resposta é de até quatro horas úteis.',
      },
      {
        id: 'CASE_4',
        question: 'Em quais dias e horários o suporte funciona?',
        context: 'O suporte funciona de segunda a sexta das 8h às 18h.',
      },
    ];

    const metrics: CallMetrics[] = [];

    for (const scenario of scenarios) {
      const start = Date.now();

      const response = await client.responses.create({
        model,
        instructions:
          'Responda somente com base no contexto fornecido. ' + 'Seja direto e objetivo.',
        input: `
Contexto:
${scenario.context}

Pergunta:
${scenario.question}
        `,
      });

      const durationMs = Date.now() - start;

      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      const totalTokens = response.usage?.total_tokens ?? 0;

      const estimatedCostUSD = calculateEstimatedCost(inputTokens, outputTokens);

      metrics.push({
        id: scenario.id,
        inputTokens,
        outputTokens,
        totalTokens,
        durationMs,
        estimatedCostUSD,
      });
    }

    console.log('\n=== Suite Call Metrics ===');
    console.log(metrics);

    const summary = {
      totalRequests: metrics.length,
      totalInputTokens: metrics.reduce((sum, item) => sum + item.inputTokens, 0),
      totalOutputTokens: metrics.reduce((sum, item) => sum + item.outputTokens, 0),
      totalTokens: metrics.reduce((sum, item) => sum + item.totalTokens, 0),
      averageLatencyMs: average(metrics.map((item) => item.durationMs)),
      totalEstimatedCostUSD: metrics.reduce((sum, item) => sum + item.estimatedCostUSD, 0),
    };

    console.log('\n=== Suite Observability Summary ===');
    console.log(summary);

    expect(metrics).toHaveLength(scenarios.length);

    expect(summary.totalRequests).toBe(scenarios.length);
    expect(summary.totalInputTokens).toBeGreaterThan(0);
    expect(summary.totalOutputTokens).toBeGreaterThan(0);
    expect(summary.totalTokens).toBeGreaterThan(0);
    expect(summary.averageLatencyMs).toBeGreaterThan(0);
    expect(summary.totalEstimatedCostUSD).toBeGreaterThan(0);
  });
});
