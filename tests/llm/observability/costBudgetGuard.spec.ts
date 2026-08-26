import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const INPUT_PRICE_PER_MILLION = 0.2;
const OUTPUT_PRICE_PER_MILLION = 1.2;

const calculateEstimatedCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;

  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

  return inputCost + outputCost;
};

test.describe('LLM - Observability - Cost Budget Guard', () => {
  test('deve impedir que o custo estimado da suíte ultrapasse o orçamento definido', async () => {
    test.setTimeout(120_000);

    const client = new OpenAI();

    const model = 'gpt-5.6-luna';

    const scenarios = [
      {
        question: 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?',
        context: 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.',
      },
      {
        question: 'O que acontece durante o período de bloqueio?',
        context: 'Durante o bloqueio, novas tentativas de autenticação não são permitidas.',
      },
      {
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        context: 'O prazo médio para a primeira resposta é de até quatro horas úteis.',
      },
      {
        question: 'Em quais dias e horários o suporte funciona?',
        context: 'O suporte funciona de segunda a sexta das 8h às 18h.',
      },
    ];

    let totalEstimatedCostUSD = 0;
    let totalTokens = 0;

    for (const scenario of scenarios) {
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

      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;

      totalTokens += response.usage?.total_tokens ?? 0;

      totalEstimatedCostUSD += calculateEstimatedCost(inputTokens, outputTokens);
    }

    const maximumAllowedCostUSD = 0.001;

    console.log('\n=== Cost Budget Guard ===');
    console.log({
      model,
      totalRequests: scenarios.length,
      totalTokens,
      totalEstimatedCostUSD,
      maximumAllowedCostUSD,
      budgetRemainingUSD: maximumAllowedCostUSD - totalEstimatedCostUSD,
    });

    expect(totalEstimatedCostUSD).toBeLessThanOrEqual(maximumAllowedCostUSD);
  });
});
