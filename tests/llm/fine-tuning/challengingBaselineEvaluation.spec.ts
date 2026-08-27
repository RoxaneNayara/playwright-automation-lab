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
    input: 'Depois de várias tentativas, meu acesso parou de funcionar e não consigo mais entrar.',
    expectedLabel: 'ACCOUNT_ACCESS',
  },
  {
    id: 'CASE_2',
    input: 'O valor apareceu duas vezes na fatura, mas eu fiz a compra apenas uma vez.',
    expectedLabel: 'PAYMENT',
  },
  {
    id: 'CASE_3',
    input: 'Preciso falar com alguém, mas não sei se vocês ainda estão atendendo agora.',
    expectedLabel: 'SUPPORT',
  },
  {
    id: 'CASE_4',
    input: 'Minha senha parece correta, mas mesmo assim o sistema não deixa eu acessar a conta.',
    expectedLabel: 'ACCOUNT_ACCESS',
  },
  {
    id: 'CASE_5',
    input: 'Tem um lançamento no cartão que não lembro de ter feito.',
    expectedLabel: 'PAYMENT',
  },
  {
    id: 'CASE_6',
    input: 'Quero saber quando consigo falar com a equipe responsável pelo atendimento.',
    expectedLabel: 'SUPPORT',
  },
  {
    id: 'CASE_7',
    input: 'Não consigo entrar e também apareceu uma cobrança estranha na minha conta.',
    expectedLabel: 'ACCOUNT_ACCESS',
  },
  {
    id: 'CASE_8',
    input: 'Preciso saber se o suporte pode me ajudar hoje com uma cobrança duplicada.',
    expectedLabel: 'PAYMENT',
  },
];

test.describe('LLM - Fine-tuning - Challenging Baseline Evaluation', () => {
  test('deve medir o desempenho do modelo base em casos mais ambíguos', async () => {
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
          'Escolha a categoria principal da solicitação. ' +
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

    console.log('\n=== Challenging Baseline Results ===');
    console.log(results);

    console.log('\n=== Challenging Baseline Summary ===');
    console.log({
      model,
      totalCases: evaluationDataset.length,
      correctAnswers,
      accuracy,
    });

    expect(accuracy).toBeGreaterThanOrEqual(0.75);
  });
});
