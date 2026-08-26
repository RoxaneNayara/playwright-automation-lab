import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG Evals - Answer Correctness', () => {
  test('deve reconhecer resposta semanticamente correta mesmo com palavras diferentes', async () => {
    const client = new OpenAI();

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

    const referenceAnswer = 'A conta fica bloqueada por 30 minutos.';

    const generatedAnswer = 'A conta permanece bloqueada durante meia hora.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de respostas de um sistema RAG. ' +
        'Avalie apenas a correção factual da resposta gerada em relação à pergunta, ' +
        'ao contexto e à resposta de referência. ' +
        'Considere equivalências semânticas, como "meia hora" e "30 minutos". ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa totalmente correta.',
      input: `
Pergunta:
${question}

Contexto:
${context}

Resposta de referência:
${referenceAnswer}

Resposta gerada:
${generatedAnswer}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Evaluation:', evaluation);

    expect(evaluation.score).toBeGreaterThanOrEqual(0.9);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });
});

test('deve atribuir score baixo para resposta factualmente incorreta', async () => {
  const client = new OpenAI();

  const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

  const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

  const referenceAnswer = 'A conta fica bloqueada por 30 minutos.';

  const generatedAnswer = 'A conta permanece bloqueada por 45 minutos.';

  const response = await client.responses.create({
    model: 'gpt-5.6-luna',
    instructions:
      'Você é um avaliador de respostas de um sistema RAG. ' +
      'Avalie apenas a correção factual da resposta gerada em relação à pergunta, ' +
      'ao contexto e à resposta de referência. ' +
      'Retorne somente JSON válido no formato: ' +
      '{"score": number, "reason": string}. ' +
      'O score deve variar de 0 a 1, onde 1 significa totalmente correta ' +
      'e 0 significa factualmente incorreta.',
    input: `
Pergunta:
${question}

Contexto:
${context}

Resposta de referência:
${referenceAnswer}

Resposta gerada:
${generatedAnswer}
    `,
  });

  const evaluation = JSON.parse(response.output_text.trim()) as {
    score: number;
    reason: string;
  };

  console.log('Incorrect answer evaluation:', evaluation);

  expect(evaluation.score).toBeLessThanOrEqual(0.2);
  expect(evaluation.reason.length).toBeGreaterThan(0);
});
