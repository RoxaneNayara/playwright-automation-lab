import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG Evals - Answer Relevance', () => {
  test('deve atribuir score alto para resposta diretamente relevante', async () => {
    const client = new OpenAI();

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const generatedAnswer = 'A conta fica bloqueada por 30 minutos.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de relevância de respostas de um sistema RAG. ' +
        'Avalie se a resposta gerada responde diretamente ao que foi perguntado. ' +
        'Não avalie correção factual neste teste; avalie apenas relevância e foco. ' +
        'Penalize informações desnecessárias, desvios de assunto e conteúdo que não ajuda a responder à pergunta. ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa totalmente relevante.',
      input: `
Pergunta:
${question}

Resposta gerada:
${generatedAnswer}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Relevant answer evaluation:', evaluation);

    expect(evaluation.score).toBeGreaterThanOrEqual(0.9);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });

  test('deve atribuir score baixo para resposta com informações irrelevantes', async () => {
    const client = new OpenAI();

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

    const generatedAnswer =
      'A conta fica bloqueada por 30 minutos. ' +
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Cobranças duplicadas devem ser encaminhadas ao suporte financeiro.';

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de relevância de respostas de um sistema RAG. ' +
        'Avalie se a resposta gerada responde diretamente ao que foi perguntado. ' +
        'Não avalie correção factual neste teste; avalie apenas relevância e foco. ' +
        'Penalize informações desnecessárias, desvios de assunto e conteúdo que não ajuda a responder à pergunta. ' +
        'Retorne somente JSON válido no formato: ' +
        '{"score": number, "reason": string}. ' +
        'O score deve variar de 0 a 1, onde 1 significa totalmente relevante.',
      input: `
Pergunta:
${question}

Resposta gerada:
${generatedAnswer}
      `,
    });

    const evaluation = JSON.parse(response.output_text.trim()) as {
      score: number;
      reason: string;
    };

    console.log('Irrelevant answer evaluation:', evaluation);

    expect(evaluation.score).toBeLessThan(0.9);
    expect(evaluation.reason.length).toBeGreaterThan(0);
  });
});
