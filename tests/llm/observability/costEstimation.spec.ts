import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const INPUT_PRICE_PER_MILLION = 0.2;
const OUTPUT_PRICE_PER_MILLION = 1.2;

const calculateEstimatedCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;

  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

  return inputCost + outputCost;
};

test.describe('LLM - Observability - Cost Estimation', () => {
  test('deve estimar o custo da chamada com base nos tokens utilizados', async () => {
    const client = new OpenAI();

    const model = 'gpt-5.6-luna';

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

    const response = await client.responses.create({
      model,
      instructions: 'Responda somente com base no contexto fornecido. ' + 'Seja direto e objetivo.',
      input: `
Contexto:
${context}

Pergunta:
${question}
      `,
    });

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    const estimatedCost = calculateEstimatedCost(inputTokens, outputTokens);

    console.log('\n=== LLM Cost Estimation ===');
    console.log({
      model,
      inputTokens,
      outputTokens,
      inputPricePerMillion: INPUT_PRICE_PER_MILLION,
      outputPricePerMillion: OUTPUT_PRICE_PER_MILLION,
      estimatedCostUSD: estimatedCost,
    });

    expect(inputTokens).toBeGreaterThan(0);
    expect(outputTokens).toBeGreaterThan(0);
    expect(estimatedCost).toBeGreaterThan(0);
  });
});
