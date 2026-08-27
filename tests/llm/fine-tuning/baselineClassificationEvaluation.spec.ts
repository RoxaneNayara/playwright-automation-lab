import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

type EvaluationCase = {
  id: string;
  input: string;
  expectedLabel: 'ACCOUNT_ACCESS' | 'PAYMENT' | 'SUPPORT';
};

const evaluationDataset: EvaluationCase[] = [
  {
    id: 'CASE_1',
    input: 'Não consigo entrar na minha conta porque ela foi bloqueada.',
    expectedLabel: 'ACCOUNT_ACCESS',
  },
  {
    id: 'CASE_2',
    input: 'Existe uma cobrança duplicada no meu cartão.',
    expectedLabel: 'PAYMENT',
  },
  {
    id: 'CASE_3',
    input: 'Quero saber até que horas o suporte atende hoje.',
    expectedLabel: 'SUPPORT',
  },
  {
    id: 'CASE_4',
    input: 'Errei minha senha várias vezes e agora não consigo acessar.',
    expectedLabel: 'ACCOUNT_ACCESS',
  },
  {
    id: 'CASE_5',
    input: 'Apareceu uma cobrança que eu não reconheço.',
    expectedLabel: 'PAYMENT',
  },
  {
    id: 'CASE_6',
    input: 'Quais são os dias de atendimento da equipe de suporte?',
    expectedLabel: 'SUPPORT',
  },
];

test.describe('LLM - Fine-tuning - Baseline Classification Evaluation', () => {
  test('deve medir a acurácia do modelo base antes do fine-tuning', async () => {
    test.setTimeout(120_000);

    const client = new OpenAI();

    const model = 'gpt-5.6-luna';

    const allowedLabels = ['ACCOUNT_ACCESS', 'PAYMENT', 'SUPPORT'];

    const results = [];

    for (const evaluationCase of evaluationDataset) {
      const response = await client.responses.create({
        model,
        instructions:
          'Classifique a solicitação em exatamente uma das seguintes categorias: ' +
          'ACCOUNT_ACCESS, PAYMENT ou SUPPORT. ' +
          'Retorne somente o nome da categoria, sem explicações.',
        input: evaluationCase.input,
      });

      const predictedLabel = response.output_text.trim();

      const correct = predictedLabel === evaluationCase.expectedLabel;

      results.push({
        id: evaluationCase.id,
        input: evaluationCase.input,
        expectedLabel: evaluationCase.expectedLabel,
        predictedLabel,
        correct,
      });

      expect(allowedLabels).toContain(predictedLabel);
    }

    const correctAnswers = results.filter((result) => result.correct).length;

    const accuracy = correctAnswers / evaluationDataset.length;

    console.log('\n=== Baseline Classification Results ===');
    console.log(results);

    console.log('\n=== Baseline Classification Summary ===');
    console.log({
      model,
      totalCases: evaluationDataset.length,
      correctAnswers,
      accuracy,
    });

    expect(accuracy).toBeGreaterThanOrEqual(0.8);
  });
});
