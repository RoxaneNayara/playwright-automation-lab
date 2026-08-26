import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG Evals - Faithfulness', () => {
  test('deve atribuir score alto para resposta totalmente sustentada pelo contexto', async () => {
    const client = new OpenAI();

    const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

    const generatedAnswer =
      'A conta fica bloqueada por 30 minutos após cinco tentativas inválidas de login.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de faithfulness de um sistema RAG. ' +
        'Avalie se todas as afirmações da resposta gerada são sustentadas pelo contexto fornecido. ' +
        'Não avalie se a resposta é útil ou relevante para a pergunta; avalie apenas se ela está fundamentada no contexto. ' +
        'Penalize qualquer informação adicionada que não esteja explicitamente sustentada pelo contexto. ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa totalmente sustentada pelo contexto.',
      input: `
Contexto:
${context}

Resposta gerada:
${generatedAnswer}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Faithful answer evaluation:', evaluation);

    expect(evaluation.score).toBeGreaterThanOrEqual(0.9);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });

  test('deve atribuir score menor para resposta que adiciona informação não sustentada', async () => {
    const client = new OpenAI();

    const context = 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.';

    const generatedAnswer =
      'A conta fica bloqueada por 30 minutos após cinco tentativas inválidas de login. ' +
      'Além disso, o usuário recebe um e-mail automático informando sobre o bloqueio.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de faithfulness de um sistema RAG. ' +
        'Avalie se todas as afirmações da resposta gerada são sustentadas pelo contexto fornecido. ' +
        'Não avalie se a resposta é útil ou relevante para a pergunta; avalie apenas se ela está fundamentada no contexto. ' +
        'Penalize qualquer informação adicionada que não esteja explicitamente sustentada pelo contexto. ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa totalmente sustentada pelo contexto.',
      input: `
Contexto:
${context}

Resposta gerada:
${generatedAnswer}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Unfaithful answer evaluation:', evaluation);

    expect(evaluation.score).toBeLessThan(0.9);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });
});
